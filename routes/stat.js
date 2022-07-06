/*
    Routes for the stats API.
*/

const router = require('express').Router();
const {getQuoteStats} = require('../models/quote');

// Get some stats for the quotes collection.
router.get("/quotes", async (req, res) => {
  
  let stat = await getQuoteStats().catch(err => {
    return res.status(500).json({error: err.message});
  });
  return res.json(stat);
});

module.exports = router;
