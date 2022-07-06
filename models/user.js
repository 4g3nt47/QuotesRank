/*
    Our user model.
*/

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const crypto = require('crypto');
const {Quote} = require('./quote');

// Our schema for the 'users' collection.
const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  joinedOn: {
    type: Number,
    required: true
  },
  admin: {
    type: Boolean,
    required: true
  },
  upvotes: {
    type: Object,
    required: true
  },
  downvotes: {
    type: Object,
    required: true
  }
});

// Add some methods to it that will be used during sign up and login.

userSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.password = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
};

userSchema.methods.validPassword = function(password){
  return (crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex') === this.password);
};

// Quote voting related functions.

userSchema.methods.hasUpvoted = function(id){
  return (this.upvotes.indexOf(id.toString()) != -1);
};

userSchema.methods.hasDownvoted = function(id){
  return (this.downvotes.indexOf(id.toString()) != -1);
};

// Upvote a quote.
userSchema.methods.upvoteQuote = async function (id){

  if (!ObjectId.isValid(id))
    throw new Error("Invalid quote ID!");
  if (this.hasUpvoted(id)) // Already upvoted?
    throw new Error("Quote has already been upvoted!");
  // Start with updating votes count in the db.
  let data = await Quote.updateOne({_id: new ObjectId(id)}, {$inc: {votes: 1}});
  if (data.modifiedCount == 0)
    throw new Error("Unable to upvote quote!");
  if (this.hasDownvoted(id)){ // Quote was previously downvoted by the user?
    // Undo the previous downvote.
    this.downvotes.splice(this.downvotes.indexOf(id), 1);
    await Quote.updateOne({_id: new ObjectId(id)}, {$inc: {votes: 1}})
    // Update upvotes tracker and save changes.
    this.upvotes.push(id);
    return (await User.updateOne({username: this.username}, {upvotes: this.upvotes, downvotes: this.downvotes}));
  }else{
    // No previous downvote, so just upvote and move on...
    this.upvotes.push(id);
    return (await User.updateOne({username: this.username}, {upvotes: this.upvotes}));
  }
};

// Downvote a quote.
userSchema.methods.downvoteQuote = async function(id){

  if (!ObjectId.isValid(id))
    throw new Error("Invalid quote ID!");
  if (this.hasDownvoted(id)) // Already downvoted?
    throw new Error("Quote has already been downvoted!");
  // Update upvotes count in the db.
  let data = await Quote.updateOne({_id: new ObjectId(id)}, {$inc: {votes: -1}});
  if (data.modifiedCount == 0)
    throw new Error("Unable to downvote quote!");
  if (this.hasUpvoted(id)){ // Quote previously upvoted by the user?
    // Undo the upvote.
    this.upvotes.splice(this.upvotes.indexOf(id), 1);
    await Quote.updateOne({_id: new ObjectId(id)}, {$inc: {votes: -1}});
    // Update downvotes tracker and save changes.
    this.downvotes.push(id);
    return (await User.updateOne({username: this.username}, {upvotes: this.upvotes, downvotes: this.downvotes}));
  }else{
    // No previous upvote, so just upvote and move on.
    this.downvotes.push(id);
    return (await User.updateOne({username: this.username}, {upvotes: this.upvotes}));
  }
};

// Apply the schema and export the collection.
const User = mongoose.model('users', userSchema);
exports.User = User;

// For creating user accounts.
exports.registerUser = async (username, password) => {

  username = username.toString().trim();
  password = password.toString().trim();
  if (!(new RegExp(/^[A-Za-z0-9]{3,32}$/).test(username)))
    throw new Error("Invalid username!");
  if (!(new RegExp(/^.{8,64}$/).test(password)))
    throw new Error("Invalid password");
  let exists = await User.findOne({username: username});
  if (exists)
    throw new Error("Username already exists!");
  let user = new User({
    username,
    password,
    admin: false,
    joinedOn: Date.now(),
    upvotes: [],
    downvotes: []
  });
  user.setPassword(password);
  await user.save();
  return user;
};

// Handles user logins.
exports.loginUser = async (username, password) => {
  
  username = username.toString().trim();
  password = password.toString().trim();
  let user = await User.findOne({username});
  if (!user)
    throw new Error("Authentication failed!");
  if (!(user.validPassword(password)))
    throw new Error("Authentication failed!");
  return user;
};

// Returns an array of all users.
exports.getUsers = async (hideSensitive = false) => {

  if (hideSensitive)
    return (await User.find({}, {salt: false, password: false}));
  return (await User.find({}));
};

// Delete a user account.
exports.deleteUser = async (id) => {

  if (!ObjectId.isValid(id))
    throw new Error("Invalid user ID!");
  let data = await User.deleteOne({_id: new ObjectId(id)});
  if (data.deletedCount > 0)
    return data;
  throw new Error("Invalid user!");
};
