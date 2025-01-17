const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const addUser = async (username, password) => {
  try {
    const newUser = await prisma.user.create({
      data: { username, password },
    });
  } catch (err) {
    console.log("Error adding new user to database: ", error);
    throw error;
  }
};

module.exports = {
  addUser,
};
