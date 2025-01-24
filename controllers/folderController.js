const query = require("../prisma/queries");

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const units = ["Bytes", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const k = 1024; // Size of 1 KB in bytes
  const i = Math.floor(Math.log(bytes) / Math.log(k)); // Determine the unit

  let size;
  if (i === 0) {
    size = bytes;
  } else {
    size = bytes / Math.pow(k, i);
    size = i === 1 ? Math.floor(size) : size.toFixed(1);
  }
  
  return `${size} ${units[i]}`;
}

const getUserPage = async (req, res) => {
  try {
    const currentUser = res.locals.currentUser;
    const userId = req.user.id;

    if (!req.user || userId !== currentUser.id) {
      return res.status(403).send("Unauthorized.");
    }

    if (!req.params.folderId) {
      const homeFolderId = await query.getHomeFolderById(userId);
      return res.redirect(`/folder/${homeFolderId}`);
    }

    const folderId = parseInt(req.params.folderId);
    const currentFolder = await query.getFolderById(folderId);
    if (!currentFolder) {
      return res.status(404).render("error404");
    }
    const files = await query.getFilesByFolderId(folderId);
    const formattedFiles = files.map(file => ({
      ...file,
      size: formatBytes(file.size),
    }));
  
    res.render("userPage", {
      title: currentUser.username,
      currentFolder: currentFolder,
      files: formattedFiles,
    });

  } catch(error) {
    console.error(error);
    res.status(500).send("An error occurred while loading the user page.");
  }
};

const createFolder = async (req, res) => {
  const userId = parseInt(req.user.id);
  const folderId = parseInt(req.params.folderId);

  const { folderName } = req.body;

  try {
    await query.createFolder(folderName, userId, folderId);
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
