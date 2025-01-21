const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const passport = require("../config/passport");
const query = require("../db/queries");

const getIndex = (req, res) => {
  res.render("index");
};

const getSignup = (req, res) => {
  res.render("signup", { errors: null });
  res.end();
};

const handleSignUp = asyncHandler(async (req, res, next) => {
  const result = validationResult(req);
  console.log(result);
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

const getLogIn = (req, res) => {
  res.render("login", { errors: null });
};

const handleLogIn = asyncHandler(async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).render("login", { error: info.message });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect(`/user/${req.user.id}/folder`);
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

const getUpload = async (req, res) => {
  try {
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
};

const handleUpload = async (req, res) => {
  try {
    if (req.params.id !== req.user.id.toString()) {
      return res.status(403).json({ message: "Unauthorized." });
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
  const user = res.locals.currentUser;
  const userId = parseInt(req.params.id);
  // const files = await query.getFilesByUserId(user.id);
  let folderId = req.params.folderId
    ? parseInt(req.params.folderId)
    : await query.getHomeFolderById(userId);
    console.log(folderId);
  const currentFolder = await query.getFolderById(folderId);
  console.log(currentFolder);

  res.render("userPage", {
    title: user.username,
    currentFolder: currentFolder,
    files: files,
  });
};

const createFolder = async (req, res) => {
  const userId = parseInt(req.params.id);

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

const getErrorPage = (req, res) => {
  res.status(404).render("error404");
};

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
  createFolder,
  deleteFolder,
  // editFolder,
  getErrorPage,
};
