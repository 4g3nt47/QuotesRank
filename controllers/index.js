/*
   Controllers for the standalone pages of the web application.
*/

const {
  Quote, getQuote, getQuotes, getQuoteStats, searchQuotes
} = require('../models/quote');

// Handles homepage.
exports.homeController = (req, res) => {
  
  let page = parseInt(req.query.page || 0);
  let quotesPerPage = 24;
  getQuoteStats().then(stats => {
    getQuotes(true, quotesPerPage, (quotesPerPage * page), {time_approved: -1}).then(quotes => {
      return res.render("home", {quotes, req, page, quotesPerPage, stats});
    }).catch(error => {
      return res.render("home", {quotes: [], req, stats});
    });
  }).catch(error => {
    return res.status(500).render("error", {error});
  });
};

// Single quote page.
exports.quoteViewController = (req, res) => {

  let id = req.params.id;
  getQuote(id).then(quote => {
    return res.render("quote", {req, quote});
  }).catch(error => {
    return res.status(404).render("404", {req});
  });
};

// Handles top 50 page.
exports.topController = (req, res) => {

  getQuotes(true, 50, 0, {votes: -1}).then(quotes => {
    return res.render("top", {quotes, req});
  }).catch(error => {
    return res.status(500).render("error", {error});
  });
};

// Handles search page.
exports.searchController = (req, res) => {

  searchQuotes(req.body.query).then(quotes => {
    return res.render("search", {quotes, req});
  }).catch(error => {
    return res.status(500).render("error", {error});
  });
};

// Handles profile page.
exports.profileController = (req, res) => {

  if (!req.session.loggedIn)
    return res.redirect("/login");
  Quote.countDocuments({submitter: req.session.username, approved: true}, (error, count) => {
    if (error)
      return res.status(500).render("error", {error});
    return res.render("profile", {req, approvedCount: count});
  });
};

// Handles the page used to submit quotes.
exports.addQuoteController = (req, res) => {

  if (!req.session.loggedIn)
    return res.redirect("/login");
  return res.render("addQuote", {req});
};

// Handles the about page.
exports.aboutController = (req, res) => {

  getQuoteStats().then(stats => {
    return res.render("about", {req, stats});
  }).catch(error => {
    return res.status(500).render("error", {error});
  });
};

// Handles the admin page for approving/rejecting new quotes.
exports.pendingController = (req, res) => {

  if (!req.session.admin)
    return res.redirect("/login");
  getQuotes(false, 50, 0, {time_submitted: 1}).then(quotes => {
    return res.render("pending", {quotes, req});
  }).catch(error => {
    return res.status(500).render("error", {error});
  });
};