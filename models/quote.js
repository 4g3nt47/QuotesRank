/*
    The quotes model.
*/

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Our quotes schema

const quoteSchema = mongoose.Schema({
  quote: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  submitter: {
    type: String,
    required: true
  },
  votes: {
    type: Number,
    required: true
  },
  approved: {
    type: Boolean,
    required: true
  },
  time_submitted: {
    type: Number,
    required: true
  },
  time_approved: {
    type: Number,
    required: true
  }
});

// Apply and export.
const Quote = mongoose.model("quotes", quoteSchema);
exports.Quote = Quote;

// For adding a new quote by a user.
exports.addQuote = async (quote, author, user) => {

  quote = quote.toString().trim();
  author = author.toString().trim();
  if (quote.length < 5)
    throw new Error("Quote too short!");
  if (quote.length > 300)
    throw new Error("Quote must be <= 300 characters!");
  if (author.length < 2)
    throw new Error("Author name too short!");
  if (author.length > 32)
    throw new Error("Author name too long!");
  let newQuote = new Quote({
    quote: quote,
    author: author,
    submitter: user.username,
    votes: 0,
    approved: user.admin,
    time_submitted: Date.now(),
    time_approved: Date.now()
  });
  return (await newQuote.save());
};

// For getting a quote from the database. Returns a promise.
exports.getQuote = async (id) => {

  if (!ObjectId.isValid(id))
    throw new Error("Invalid quote ID!");
  let quote = await Quote.findOne({_id: new ObjectId(id)});
  if (!quote)
    throw new Error("Invalid quote!");
  return quote;
};

// For fetching quotes from the database.
exports.getQuotes = async (approved, count, skip, sort) => {

  approved = (approved === true || approved == 1)
  count = parseInt(count);
  skip = parseInt(skip);
  return (await Quote.find({approved: approved}, null, {skip: skip, limit: count, sort: sort}));
};

// For deleting quotes.
exports.deleteQuote = async (id) => {

  if (!ObjectId.isValid(id))
    throw new Error("Invalid quote ID!");
  return (await Quote.deleteOne({_id: new ObjectId(id)}));
};

// For updating quotes.
exports.updateQuote = async (id, quote, author) => {

  if (!ObjectId.isValid(id))
    throw new Error("Invalid quote ID!");
  quote = quote.toString();
  author = author.toString();
  if (!(quote.length > 4 && quote.length < 301 && author.length > 1 && author.length < 33))
    throw new Error("Invalid quote/author!");
  let result = await Quote.updateOne({_id: new ObjectId(id)}, {quote, author});
  if (result.modifiedCount > 0)
    throw new Error("Unable to update quote!");
  return result;
};

// For searching quotes.
exports.searchQuotes = async (query, limit = 20) => {

  query = query.toString();
  let rule = new RegExp(query, "i");
  return (await Quote.find({$or: [{quote: rule}, {author: rule}]}, null, {limit}));
};

// Returns an array of quotes awaiting approval.
exports.getPending = async (limit = 50) => {
  return (await Quote.find({approved: false}, null, {limit: parseInt(limit)}));
};

// For approving a pending quote.
exports.approveQuote = async (id) => {

  if (!ObjectId.isValid(id))
    throw new Error("Invalid quote ID!");
  let data = await Quote.updateOne({_id: new ObjectId(id)}, {approved: true});
  if (data.modifiedCount > 0)
    return data;
  throw new Error("Unable to approve quote!");
};

// For getting some stats for the quotes collection.
exports.getQuoteStats = async () => {

  let approved = await Quote.countDocuments({approved: true});
  let pending = await Quote.countDocuments({approved: false});
  let last24hr = await Quote.countDocuments({time_submitted: {$gte: (Date.now() - (1000 * 60 * 60 * 24))}});
  return {approved, pending, last24hr};
};
