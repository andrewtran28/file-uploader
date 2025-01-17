const express = require("express");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const passport = require("./config/passport");
const path = require("node:path");
const indexController = require("./controllers/indexController");
const { signupValidator } = require("./controllers/validator.js");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//Express-Session Setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, //ms
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);
app.use(passport.initialize());
app.use(passport.session());

//Authentication setup
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login"); // Redirect to /login if not authenticated
};

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

//Routing
app.get("/", indexController.getIndex);
app.get("/signup", indexController.getSignup);
app.post("/signup", signupValidator, indexController.handleSignUp);
app.get("/login", indexController.getLogIn);
app.post("/login", indexController.handleLogIn);
app.get("/logout", indexController.handleLogOut);

app.use(indexController.getErrorPage);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express App - Listening on port http://localhost:${PORT}`);
});
