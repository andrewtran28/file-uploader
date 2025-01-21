// const asyncHandler = require("express-async-handler");
const query = require("../db/queries");

const getUpload = async (req, res) => {
  try {
    if (!req.user || req.user.id !== res.locals.currentUser.id) {
      return res.status(403).send("Unauthorized.");
    }

    res.render("uploadFile", {
      user: res.locals.currentUser,
      errors: null,
      // folders: folders,
      // currentFolder: currentFolder,
      // files: files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while loading the page.");
  }
};

const handleUpload = async (req, res) => {
  try {
    if (!req.user || req.user.id !== res.locals.currentUser.id) {
      return res.status(403).send("Unauthorized.");
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    console.log("File uploaded successfully:", req.file);

    return res.redirect(`/user/${res.locals.currentUser.id}`);
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).send("An error occurred while uploading the file.");
  }
};

const getUserPage = async (req, res) => {
  try {
    if (!req.user || req.user.id !== res.locals.currentUser.id) {
      return res.status(403).send("Unauthorized.");
    }

    const user = res.locals.currentUser;
    const userId = req.user.id;
    let folderId = req.params.folderId
      ? parseInt(req.params.folderId)
      : await query.getHomeFolderById(userId);
      console.log(folderId);
    const currentFolder = await query.getFolderById(folderId);
    const files = await query.getFilesByFolderId(folderId);
    console.log(currentFolder);
  
    res.render("userPage", {
      title: user.username,
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

  let folderId = req.params.folderId
    ? parseInt(req.params.folderId)
    : await query.getHomeFolderById(userId);

  const { folderName } = req.body;

  try {
    await query.createFolder(folderName, req.user.id, folderId);
    return res.redirect(`/user/${userId}/folder/${folderId}`);
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

    res.redirect(`/user/${req.user.id}/folder/${folder.parent_id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while deleting the folder.");
  }
};

const renameFolder = async (req, res) => {
  const folderId = parseInt(req.params.folderId);
  
}

// const editFolder = async (req, res) => {
//   const { folderId } = req.params;
//   const { folderName } = req.body;

//   try {
//     const folder = await query.getFolderById(parseInt(folderId));
//     if (!folder || folder.userId !== req.user.id) {
//       return res.status(403).send("Invalid folder or access denied.");
//     }

//     await query.updateFolder(folderId, folderName);
//     res.redirect("/upload");
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("An error occurred while editing the folder.");
//   }
// };

module.exports = {
  getUserPage,
  getUpload,
  handleUpload,
  createFolder,
  deleteFolder,
  // editFolder,
};
