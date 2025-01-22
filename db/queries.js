const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const addUser = async (username, password) => {
  try {
    const newUser = await prisma.user.create({
      data: {
        username: username,
        password: password,
        folders: {
          create: { name: "Home" },
        },
      },
    });
  } catch (error) {
    console.error("Error adding new user to database: ", error);
    throw error;
  }
};

const getFolderById = async (folder_id) => {
  if (isNaN(folder_id)) {
    throw new Error("Invalid ID");
  }
  return await prisma.folder.findUnique({
    where: { id: folder_id },
    include: { subfolders: true },
  });
};

const getFileById = async (fileId) => {
  return await prisma.file.findUnique({
    where: { id: fileId },
  });
};

const handleFileUpload = async (fileName, size, url, public_id, user_id, folder_id) => {
  await prisma.file.create({
    data: {
      name: fileName,
      size,
      url,
      public_id,
      user_id,
      folder_id,
    },
  });
};

const deleteFile = async (fileId) => {
  await prisma.file.delete({
    where: { id: fileId },
  });
};

const getFilesByFolderId = async (id) => {
  return await prisma.file.findMany({
    where: { folder_id: parseInt(id) },
    orderBy: {
      name: "asc",
    },
  });
};

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

const createFolder = async (name, user_id, parent_id) => {
  return await prisma.folder.create({
    data: { name, user_id, parent_id },
  });
};

const deleteFolder = async (folder_id, parent_id) => {
  await prisma.file.updateMany({
    where: { folder_id: folder_id },
    data: { folder_id: parent_id },
  });

  await prisma.folder.updateMany({
    where: { parent_id: folder_id },
    data: { parent_id: parent_id },
  });

  await prisma.folder.delete({
    where: { id: parseInt(folder_id) },
  });
};

const renameFolder = async (folder_id, folder_name) => {
  return await prisma.folder.update({
    where: { id: folder_id },
    data: { name: folder_name },
  });
};

module.exports = {
  addUser,
  handleFileUpload,
  deleteFile,
  getFileById,
  getFilesByFolderId,
  getHomeFolderById,
  getFolderById,
  createFolder,
  deleteFolder,
  renameFolder,
};
