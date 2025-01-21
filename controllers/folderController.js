// const asyncHandler = require("express-async-handler");
const query = require("../db/queries");

const getUserPage = async (req, res) => {
  try {
    const currentUser = res.locals.currentUser;
    const userId = req.user.id;
    if (!req.user || userId !== currentUser.id) {
      return res.status(403).send("Unauthorized.");
    }

    const folderId = req.params.folderId
      ? parseInt(req.params.folderId)
      : await query.getHomeFolderById(userId);
    const currentFolder = await query.getFolderById(folderId);
    if (!currentFolder) {
      return res.status(404).render("error404");
    }
    console.log("Current Folder: ", currentFolder);
    const files = await query.getFilesByFolderId(folderId);
  
    res.render("userPage", {
      title: currentUser.username,
      currentFolder: currentFolder,
      files: files,
    });

  } catch(error) {
    console.error(error);
    res.status(500).send("An error occurred while loading the user page.");
  }

};

const createFolder = async (req, res) => {
  const userId = parseInt(req.user.id);

  const folderId = req.params.folderId
    ? parseInt(req.params.folderId)
    : await query.getHomeFolderById(userId);

  const { folderName } = req.body;

  try {
    await query.createFolder(folderName, req.user.id, folderId);
    return res.redirect(`/folder/${folderId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while creating the folder.");
  }
};

const deleteFolder = async (req, res) => {
  const folderId = parseInt(req.params.folderId);

  try {
    const folder = await query.getFolderById(folderId);
    if (!folder || folder.user_id !== req.user.id) {
      return res.status(403).send("Invalid folder or access denied.");
    }

    await query.deleteFolder(folderId, folder.parent_id);

    res.redirect(`/folder/${folder.parent_id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while deleting the folder.");
  }
};

const renameFolder = async (req, res) => {
  const folderId = parseInt(req.params.folderId);
  const { newName } = req.body; //Name receieved from rename form submission

  try {
    const updatedFolder = await query.renameFolder(folderId, newName);
    res.redirect(`/folder/${updatedFolder.id}`)
  } catch (error) {
    console.error(error);
    res.status(500).send("Error renaming folder.");
  }
}

module.exports = {
  getUserPage,
  createFolder,
  deleteFolder,
  renameFolder,
};
