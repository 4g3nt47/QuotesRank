/*
    Controllers for the user API.
*/

const ObjectId = require('mongoose').Types.ObjectId;
const model = require('../models/user');
const {getQuote} =  require('../models/quote');

// Setup session data. Called after login.
const setupSession = (req, user) => {

  req.session.loggedIn = true;
  req.session.username = user.username;
  req.session.admin = user.admin;
  req.session.user = user;
};

// Handles user account creation.
exports.registerUser = (req, res) => {

  let {username, password, autoLogin} = req.body;
  if (!(username && password))
    return res.json({error: "Required parameters not defined!"});
  model.registerUser(username, password).then(user => {
    if (autoLogin) // Login the user automatically following sign up?
      setupSession(req, user);
    // Custom redirect to avoid auto redirecting clients to homepage, which respond with HTML
    // instead of expected JSON.
    return res.json({redirect: "/"});
  }).catch(err => {
    return res.status(403).json({error: err.message});
  });
};

// Handles user login.
exports.loginUser = (req, res) => {

  let {username, password} = req.body;
  if (!(username && password))
    return res.json({error: "Required parameters not defined!"});
  model.loginUser(username, password).then(user => {
    setupSession(req, user);
    return res.json({redirect: "/"});
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

// For fetching profile data of the logged in user.
exports.viewProfile = (req, res) => {
  
  if (!req.session.loggedIn)
    return res.status(403).json({error: "You are not logged in!"});
  let profile = req.session.user;
  // Remove some fields. Won't affect the session since it's reloaded on every request.
  profile.password = undefined;
  profile.salt = undefined;
  // Change upvotes and downvotes to their count instead of the actual IDs.
  profile.upvotes = profile.upvotes.length;
  profile.downvotes = profile.downvotes.length;
  // Remove admin field for non-admin users.
  if (profile.admin != true)
    profile.admin = undefined;
  return res.json(profile);
};

// Get all users (admins only).
exports.getUsers = (req, res) => {

  if (!req.session.admin)
    return res.status(403).json({error: "Permission denied!"});
  model.getUsers(true).then(users => {
    return res.json(users);
  }).catch(error => {
    return res.status(500).json({error: error.message});
  });
};

// Handles password change.
exports.changePassword = (req, res) => {

  // Validate session.
  if (!req.session.loggedIn)
    return res.status(403).json({error: "You are not logged in!"});
  // Validate input.
  let {password, new_password} = req.body;
  if (!(password && new_password))
    return res.status(403).json({error: "Required parameters not defined!"})
  password = password.toString();
  new_password = new_password.toString().trim();
  let user = req.session.user;
  if (!(user.validPassword(password) && new RegExp(/^.{8,64}$/).test(new_password)))
    return res.status(403).json({error: "Invalid password!"});
  // Change the password.
  user.setPassword(new_password); // This will change both our password and the salt.
  model.User.updateOne({_id: user._id.toString()}, {salt: user.salt, password: user.password}, (error, data) => {
    if (error)
      return res.status(500).json({error: error.message});
    if (data.modifiedCount > 0)
      return res.json(data);
    return res.status(403).json({error: "Unable to update password!"});
  });
};

// Handles quote upvotes.
exports.upvoteQuote = (req, res) => {

  if (!req.session.loggedIn)
    return res.status(403).json({error: "You must be logged in to vote!"});
  let id = req.params.id;
  if (!id)
    return res.status(403).json({error: "Required parameters not defined!"});
  req.session.user.upvoteQuote(id).then(data => {
    getQuote(id).then(quote => {
      return res.json({votes: quote.votes});
    }).catch(error => {
      return res.json({error: error.message});
    });
  }).catch(error => {
    return res.status(500).json({error: error.message});
  });
};

// Handles quote downvotes.
exports.downvoteQuote = (req, res) => {

  if (!req.session.loggedIn)
    return res.status(403).json({error: "You must be logged in to vote!"});
  let id = req.params.id;
  req.session.user.downvoteQuote(id).then(data => {
    getQuote(id).then(quote => {
      return res.json({votes: quote.votes})
    }).catch(error => {
      return res.json({error: error.message});
    });
  }).catch(error => {
    return res.status(500).json({error: error.message});
  });
};

// Handles user account deleteion (admins only).
exports.deleteUser = (req, res) => {

  if (!req.session.admin)
    return res.status(403).json({error: "Permission denied!"});
  model.deleteUser(req.params.id).then(data => {
    return res.json(data);
  }).catch(error => {
    return res.status(500).json({error: error.message});
  });
};
