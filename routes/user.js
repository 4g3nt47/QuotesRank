/*
    API routes for the user API.
*/

const router = require('express').Router();
const {
  registerUser, loginUser, upvoteQuote, downvoteQuote, viewProfile,
  changePassword, deleteUser, getUsers
} = require('../controllers/user');

// For account creation.
router.post("/register", registerUser);

// For user login.
router.post("/login", loginUser);

// Returns profile data of logged in user.
router.get("/profile", viewProfile);

// Get all users.
router.get("/users", getUsers);

// For changing user password.
router.post("/password", changePassword);

// For upvoting and downvoting quotes.
router.get("/upvote/:id", upvoteQuote);
router.get("/downvote/:id", downvoteQuote);

// Delete a user account.
router.delete("/:id", deleteUser);

module.exports = router;
