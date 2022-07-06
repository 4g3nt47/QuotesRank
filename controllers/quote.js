/*
   The controller for the quotes API.
*/

const model = require('../models/quote');

// Handles quote submission.
exports.addQuote = (req, res) => {

  let {quote, author} = req.body;
  if (!(quote && author))
    return res.status(403).json({error: "Required parameters not defined!"});
  if (!(req.session.loggedIn))
    return res.status(403).json({error: "You must be logged in to submit quotes!"});
  // Apply a rate limit for non-admin users.
  if (req.session.admin !== true && req.session.lastQuoteSubmit){
    let elapsed = (Date.now() - req.session.lastQuoteSubmit) / 1000;
    if (elapsed < 10) // 10 seconds rate limit.
      return res.status(403).json({error: "You are being rate-limited!"});
  }
  model.addQuote(quote, author, req.session.user).then(data => {
    if (!req.session.admin)
      req.session.lastQuoteSubmit = Date.now();
    return res.json(data);
  }).catch(error => {
    return res.status(500).json({error: error.message});
  });
};

// For fetching a single quote.
exports.getQuote = (req, res) => {

  let id = req.params.id;
  if (!id)
    return res.status(403).json({error: "Required parameters not defined!"});
  model.getQuote(id).then(quote => {
    if (quote.approved == false)
      throw new Error("Invalid quote!");
    return res.json(quote);
  }).catch(error => {
    return res.status(404).json({error: error.message});
  });
};

// For getting a 'page' of quotes, sorted based on submission time (descending).
exports.getQuotes = (req, res) => {

  let page = parseInt(req.params.page || 0);
  let quotesPerPage = 24;
  model.getQuotes(true, quotesPerPage, (page * quotesPerPage), {time_approved: -1}).then(quotes => {
    return res.json(quotes);
  }).catch(error => {
    return res.status(500).json({error: error.message});
  });
};

// Update an existing quote (admins only).
exports.updateQuote = (req, res) => {

  if (!(req.session.admin))
    return res.status(403).json({error: "Permission denied!"});
  let id = req.body.id;
  let quote = req.body.quote;
  let author = req.body.author;
  if (!(id && quote && author))
    return res.status(403).json({error: "Required parameters not defined!"});
  model.updateQuote(id, quote, author).then(data => {
    return res.json(data);
  }).catch(error => {
    return res.status(500).json({error: error.message});
  });
};

// Delete a quote.
exports.deleteQuote = (req, res) => {

  let id = req.params.id;
  if (!id)
    return res.status(403).json({error: "Required parameters not defined!"});
  model.getQuote(id).then(quote => {
    // Only admin and quote submitted can delete a quote.
    if (!(req.session.admin || req.session.username === quote.submitter))
      return res.status(403).json({error: "Permission denied!"});
    model.deleteQuote(id).then(data => {
      return res.json(data);
    }).catch(error => {
      return res.status(500).json({error: error.message});
    });
  }).catch(error => {
    return res.status(500).json({error: error.message});
  })
};

// Get quotes that are awaiting approval (admins only).
exports.getPending = (req, res) => {

  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.getPending().then(quotes => {
    return res.json(quotes);
  }).catch(error => {
    return res.status(500).json({error: error.message});
  })
}

// Approve a pending quote (admins only).
exports.approveQuote = (req, res) => {

  if (req.session.admin !== true) // Only admins can delete quote.
    return res.status(403).json({error: "Permission denied!"});
  let id = req.params.id;
  if (!id)
    return res.status(403).json({error: "Required parameters not defined!"});
  model.approveQuote(id).then(data => {
    return res.json(data);
  }).catch(error => {
    return res.status(500).json({error: error.message});
  });
};

// Search quotes using regex.
exports.searchQuotes = (req, res) => {

  let query = req.body.query;
  if (!query)
    return res.status(403).json({error: "Required parameters not defined!"});
  model.searchQuotes(query).then(quotes => {
    return res.json(quotes);
  }).catch(error => {
    return res.status(500).json({error: error.message});
  });
};
