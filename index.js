/*
      Entrypoint of the QuotesRank web application.
*/

// Import our dependencies.
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const {User} = require('./models/user');
const userRoute = require('./routes/user');
const quoteRoute = require('./routes/quote'); 
const statRoute = require('./routes/stat');
const {
  homeController, quoteViewController, topController, searchController,
  profileController, addQuoteController, aboutController, pendingController
} = require('./controllers/index');

// Some constants.
DB_URL = process.env.DB_URL || "mongodb://testuser:testpass@localhost/QuotesRank";
COOKIE_SECRET = process.env.SECRET || '418b1fb21f59445105aa856a5b7b91edebda9b25340d7eeac6715f7b7918a213';
SERVER_PORT = process.env.SERVER_PORT || 3000;

// Initialise the app
const app = express();

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// Set up our session manager.
// Cookie and session expiration are set to 7 days.
// Disabling 'saveUninitialized' prevents the saving of sessions that were not assigned any data.
// Using session secret ensures that cookies sent to clients are encrypted to avoid tampering,
// and passing a secret in the 'crypto' object of the 'connect-mongo' object saves the session data
// to the database in encrypted format.
app.use(session({
  secret: COOKIE_SECRET,
  resave: true,
  saveUninitialized: false,
  cookie:{
    expires: 1000 * 60 * 60 * 24 * 7
  },
  store: MongoStore.create({
    mongoUrl: DB_URL,
    ttl: 60 * 60 * 24 * 7,
    crypto: {
      secret: COOKIE_SECRET,
    }
  })
}));

// Handle data encoding.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// A middleware that auto reload data of logged in users.
app.use((req, res, next) => {
  
  if (req.session.loggedIn){
    User.findOne({username: req.session.username}, (err, user) => {
      if (err || (!user)){
        req.session.destroy();
        return res.redirect("/");
      }
      req.session.user = user;
      req.session.admin = user.admin;
      next();
    });
  }else{
    next();
  }
});

// Set API routes.
app.use("/api/user", userRoute);
app.use("/api/quote", quoteRoute);
app.use("/api/stats", statRoute);

// Define static files dir
app.use("/static", express.static("./static"));

// Homepage.
app.get("/", homeController);

// Login page.
app.get("/login", (req, res) => {
  if (req.session.loggedIn)
    req.session.destroy(); // Destroy active session. We will be using login page as logout page also.
  res.render("login", {req});
});

// Sign up page.
app.get("/signup", (req, res) => {
  res.render("signup", {req});
});

// Search page.
app.get("/search", (req, res) => {
  res.render("search", {req, quotes: []});
});

// Search action.
app.post("/search", searchController);

// Profile page
app.get("/profile", profileController);


// About page.
app.get("/about", aboutController);

// A single quote view page.
app.get("/quote/:id", quoteViewController);

// For adding quotes.
app.get("/addQuote", addQuoteController);

// For approving pending quotes.
app.get("/pending", pendingController);

// Top 50 page.
app.get("/top50", topController);

// Error 404 page
app.get("*", (req, res) => {
  res.render('404', {req});
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).render('error');
});

// Connect to database and start the web server
console.log("[*] Connecting to database...");
mongoose.connect(DB_URL).then(() => {
  console.log("[*] Starting web server...");
  app.listen(SERVER_PORT, () => {
    console.log(`[+] Server is running on port ${SERVER_PORT}...`);
  });
}).catch(error => {
  console.log("[-] Fatal error: " + error.message);
  process.exit(1);
});
