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

const getFolderById = async (id) => {
  const parsedId = parseInt(id);
  console.log(parsedId);
  if (isNaN(parsedId)) {
    throw new Error("Invalid ID");
  }
  return await prisma.folder.findUnique({
    where: { id: parsedId },
  });
};

const getFilesByFolderId = async (id) => {
  return await prisma.file.findMany({
    where: { folderId: parseInt(id) },
  });
};

const getFilesByUserId = async (user_id) => {
  return await prisma.file.findMany({
    where: { user_id: parseInt(user_id) },
  });
};

module.exports = {
  addUser,
  getFilesByUserId,
  getFolderById,
  getFilesByFolderId,
};
