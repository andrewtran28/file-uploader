const { body } = require("express-validator");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const signupValidator = [
  body("username")
    .trim()
    .isString()
    .withMessage("Username must be a string.")
    //Check for existing username in database. Adjust for your database query
    .custom(async (newUser) => {
      const userExists = await prisma.user.findUnique({
        where: { username: newUser },
      });
      if (userExists) {
        return Promise.reject("Username already exists.");
      }
    })
    .isAlphanumeric()
    .withMessage("Username must only contain letters or numbers.")
    .bail()
    .isLength({ min: 3, max: 25 })
    .withMessage("Username must be between 3-25 characters.")
    .bail(),
  body("password")
    .trim()
    .isString()
    .withMessage("Password must be a string.")
    .isLength({ min: 4, max: 50 })
    .withMessage("Password must be between 4-50 characters.")
    .bail(),
];

module.exports = {
  signupValidator,
};
