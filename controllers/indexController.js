const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");

const getIndex = asyncHandler(async (req, res) => {
  res.render("index");
});

const getErrorPage = asyncHandler(async (req, res) => {
  res.status(404).render("error404");
});

module.exports = {
  getIndex,
  getErrorPage,
};
