/*
    API routes for dealing with quotes.
*/

const router = require('express').Router();
const {
  getQuote, addQuote, getQuotes, deleteQuote, updateQuote, approveQuote, getPending, searchQuotes
} = require('../controllers/quote');

// For a adding a quote.
router.post("/", addQuote);

// For editing a quote.
router.patch("/", updateQuote);

// Get pending quotes.
router.get("/pending", getPending);

// For approving a pending quote.
router.get("/approve/:id", approveQuote);

// For deleting a quote
router.delete("/:id", deleteQuote);

// For getting a quote by ID
router.get("/:id", getQuote);

// Get N amount of quotes for given range.
router.get("/page/:page", getQuotes);

// Search for quotes.
router.post("/search", searchQuotes);

module.exports = router;
