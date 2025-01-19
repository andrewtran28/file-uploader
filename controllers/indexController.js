const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const passport = require("../config/passport");
const query = require("../db/queries");
// const path = require("node:path");

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

const getUserPage = asyncHandler(async (req, res) => {
  const user = res.locals.currentUser;
  const files = await query.getFilesByUserId(user.id);
  res.render("userPage", { title: user.username, files: files });
});

const getUpload = asyncHandler(async (req, res) => {
  try {
    // Validate that the :id in the URL matches the authenticated user
    if (req.params.id !== req.user.id.toString()) {
      return res.status(403).send("Unauthorized.");
    }

    res.render("uploadFile", {
      user: res.locals.currentUser,
      errors: null,
      // folders: folders,
      // currentFolder: currentFolder,
      // files: files,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while loading the page.");
  }
});

const handleUpload = asyncHandler(async (req, res) => {
  try {
    if (req.params.id !== req.user.id.toString()) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    console.log("File uploaded successfully:", req.file);

    return res.redirect("/");
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).send("An error occurred while uploading the file.");
  }
});

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
  getUserPage,
  getUpload,
  handleUpload,
  getErrorPage,
};
