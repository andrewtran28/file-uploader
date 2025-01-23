const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const passport = require("../config/passport");
const query = require("../prisma/queries");

const getIndex = (req, res) => {
  res.render("index");
};

const getSignup = (req, res) => {
  res.render("signup", { errors: null });
  res.end();
};

const handleSignUp = asyncHandler(async (req, res, next) => {
  const result = validationResult(req);
  console.log(result);
  if (result.isEmpty()) {
    bcrypt.hash(req.body.password, 5, async (err, hashedPassword) => {
      if (err) {
        return next(err);
      }
      try {
        query.addUser(req.body.username, hashedPassword);
        res.redirect("/");
      } catch (dbErr) {
        return next(dbErr);
      }
    });
  } else {
    res.render("signup", { errors: result.array() });
  }
});

const getLogIn = (req, res) => {
  res.render("login", { errors: null });
};

const handleLogIn = asyncHandler(async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).render("login", { error: info.message });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect(`/folder`);
    });
  })(req, res, next);
});

const handleLogOut = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Error during logout: ", err);
      return next(err);
    }
    res.redirect("/");
  });
};

const getErrorPage = (req, res) => {
  res.status(404).render("error404");
};

module.exports = {
  getIndex,
  getSignup,
  handleSignUp,
  getLogIn,
  handleLogIn,
  handleLogOut,
  getErrorPage,
};
