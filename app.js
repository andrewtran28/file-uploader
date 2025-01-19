const express = require("express");
const session = require("express-session");
const path = require("node:path");
const multer = require("multer");
const fs = require("fs");
const passport = require("./config/passport");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const { signupValidator } = require("./controllers/validator.js");
const indexController = require("./controllers/indexController");

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
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login"); // Redirect to /login if not authenticated
};

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

//Multer middleware configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.params.id) {
      return cb(
        new Error("User ID not provided in request parameters."),
        false
      );
    }

    const userFolder = path.join(__dirname, `uploads/${req.params.id}`);
    // Ensure the user folder exists
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }

    cb(null, userFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".jpeg", ".jpg", ".png", ".pdf", ".txt"];
  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG, PDF, and TXT are allowed."),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // Max file size: 3MB
  fileFilter,
});

//Routing
app.get("/", indexController.getIndex);
app.get("/signup", indexController.getSignup);
app.post("/signup", signupValidator, indexController.handleSignUp);
app.get("/login", indexController.getLogIn);
app.post("/login", indexController.handleLogIn);
app.get("/logout", indexController.handleLogOut);

app.get("/user/:id", isAuthenticated, indexController.getUserPage);
app.get("/user/:id/upload", isAuthenticated, indexController.getUpload);
// app.post(
//   "/user/:id/upload",
//   isAuthenticated,
//   upload.single("file"),
//   indexController.handleUpload
// );
app.post(
  "/user/:id/upload",
  isAuthenticated,
  upload.single("file"),
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).send({ error: err.message });
    } else if (err) {
      return res.status(400).send({ error: err.message });
    }
    next();
  },
  indexController.handleUpload
);

app.use(indexController.getErrorPage);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express App - Listening on port http://localhost:${PORT}`);
});
