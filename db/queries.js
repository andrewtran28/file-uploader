const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const addUser = async (username, password) => {
  try {
    const newUser = await prisma.user.create({
      data: {
        username: username,
        password: password,
        //Create a home folder for the new user.
        folders: {
          create: { name: "Home" },
        },
      },
    });
  } catch (err) {
    console.log("Error adding new user to database: ", error);
    throw error;
  }
};

const getFolderById = async (id) => {
  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    throw new Error("Invalid ID");
  }
  return await prisma.folder.findUnique({
    where: { id: parsedId },
    include: { subfolders: true },
  });
};

const getFilesByFolderId = async (id) => {
  return await prisma.file.findMany({
    where: { folder_id: parseInt(id) },
  });
};

//May be obsolete--change to getFolderFiles for current folder
// const getFilesByUserId = async (user_id) => {
//   return await prisma.file.findMany({
//     where: { user_id: parseInt(user_id) },
//   });
// };

const getHomeFolderById = async (user_id) => {
  const homeFolderId = await prisma.folder.findFirst({
    where: {
      user_id: parseInt(user_id), // Match the user_id
      parent_id: null, // Ensure the folder has no parent (home folder)
    },
    select: { id: true },
  });

  return homeFolderId.id;
};

//May be obsolete--change to getSubfolders for current folder
// const getFoldersByUserId = async (user_id) => {
//   return await prisma.folder.findMany({
//     where: { user_id: parseInt(user_id) },
//   });
// };

const createFolder = async (name, user_id, parent_id) => {
  return await prisma.folder.create({
    data: { name, user_id, parent_id },
  });
};

const deleteFolder = async (folder_id, parent_id) => {
  //Move all subfolders (and files) of folder_id to parent_id
  await prisma.folder.updateMany({
    where: { parent_id: folder_id },
    data: { parent_id: parent_id }
  })

  await prisma.folder.delete({
    where: { id: parseInt(deletedFolder) },
  });
};

const editFolder = async (folder_id, folder_name) => {
  return await prisma.folder.update({
    where: { id: folder_id },
    data: { name: folder_name },
  });
};

module.exports = {
  addUser,
  // getFilesByUserId,
  getFilesByFolderId,
  getHomeFolderById,
  getFolderById,
  // getFoldersByUserId,
  createFolder,
  deleteFolder,
  editFolder,
};
