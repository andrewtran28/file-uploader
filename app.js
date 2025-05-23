require("dotenv").config();
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("node:path");
const passport = require("./config/passport");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const { signupValidator } = require("./controllers/validator.js");

const indexController = require("./controllers/indexController");
const folderController = require("./controllers/folderController.js");
const fileController = require("./controllers/fileController.js");

const app = express();
const prisma = new PrismaClient();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//Express-Session Setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, //ms
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);
app.use(passport.initialize());
app.use(passport.session());

//Authentication setup
const isAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login"); // Redirect to /login if not authenticated
};

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

//Multer memory storage setup
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // Max file size: 3MB
  fileFilter,
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".jpeg", ".jpg", ".bmp", ".gif", ".png", ".pdf", ".txt"];
  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, BMP, PNG, GIF, PDF, and TXT are allowed."), false);
  }
};

//Routing
app.get("/", indexController.getIndex);
app.get("/signup", indexController.getSignup);
app.post("/signup", signupValidator, indexController.handleSignUp);
app.get("/login", indexController.getLogIn);
app.post("/login", indexController.handleLogIn);
app.get("/logout", indexController.handleLogOut);
//DELETE USER

app.get("/folder/:folderId?", isAuth, folderController.getUserPage);

app.post("/folder/:folderId?/create", isAuth, folderController.createFolder);
app.post("/folder/:folderId?/delete", isAuth, folderController.deleteFolder);
app.post("/folder/:folderId?/rename", isAuth, folderController.renameFolder);

app.post("/folder/:folderId/uploadFile", isAuth, upload.single("file"), fileController.handleUpload); //"file" must match the name of the input field in the HTML form
app.post("/folder/:folderId/deleteFile", isAuth, fileController.handleDelete);
//RENAME FILE

app.use(indexController.getErrorPage);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express App - Listening on port http://localhost:${PORT}`);
});
