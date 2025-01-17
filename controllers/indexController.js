const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const passport = require("../config/passport");
const { validationResult } = require("express-validator");
// const { PrismaClient } = require("@prisma/client");
const prisma = require("../db/queries");

const getIndex = asyncHandler(async (req, res) => {
  res.render("index");
});

const getSignup = asyncHandler(async (req, res) => {
  res.render("signup", { errors: null });
  res.end();
});

const handleSignUp = asyncHandler(async (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    bcrypt.hash(req.body.password, 5, async (err, hashedPassword) => {
      if (err) {
        return next(err);
      }
      try {
        prisma.addUser(req.body.username, hashedPassword);
        res.redirect("/");
      } catch (dbErr) {
        return next(dbErr);
      }
    });
  } else {
    res.render("signup", { errors: result.array() });
  }
});

const getLogIn = asyncHandler(async (req, res) => {
  res.render("login", { errors: null });
});

const handleLogIn = asyncHandler(async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).render("login", { error: info.message });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect("/");
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

const getErrorPage = asyncHandler(async (req, res) => {
  res.status(404).render("error404");
});

module.exports = {
  getIndex,
  getSignup,
  handleSignUp,
  getLogIn,
  handleLogIn,
  handleLogOut,
  getErrorPage,
};
