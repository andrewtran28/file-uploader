require("dotenv").config();
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("node:path");
const passport = require("./config/passport");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { signupValidator } = require("./controllers/validator.js");

const indexController = require("./controllers/indexController");
const folderController = require("./controllers/folderController.js");
const fileController = require("./controllers/fileController.js");

const BUCKET_NAME = process.env.BUCKET_NAME;
const BUCKET_REGION = process.env.BUCKET_REGION;
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

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
});
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).send("File size exceeds the 3MB limit.");
    }
  }
  next(err);
});

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

app.get("/folder/:folderId/:fileId/url", isAuth, fileController.getFileUrl);
app.get("/folder/:folderId/:fileId/download", isAuth, fileController.getFileUrl);
app.get("/folder/:folderId/:fileId/share", isAuth, fileController.getShareableUrl);

app.post("/folder/:folderId/uploadFile", isAuth, upload.single("file"), fileController.handleUpload); //"file" must match the name of the input field in the HTML form
app.post("/folder/:folderId/deleteFile", isAuth, fileController.handleDelete);
//RENAME FILE

app.use(indexController.getErrorPage);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express App - Listening on port http://localhost:${PORT}`);
});
