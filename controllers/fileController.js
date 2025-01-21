const query = require("../db/queries");

const handleUpload = async (req, res) => {
  try {
    const { originalname, size } = req.file;
    const user = req.user;
    const folderId = req.params.folderId
      ? parseInt(req.params.folderId)
      : await query.getHomeFolderById(userId);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    console.log("File uploaded successfully:", req.file);

    if (size > 3 * 1024 * 1024) {
      return res.status(400).json({ message: "File size exceeds 3MB." });
    }

    await query.handleFileUpload(originalname, size, user.id, folderId);

    return res.redirect(`/folder/${folderId}`);
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).send("An error occurred while uploading the file.");
  }
};

module.exports = {
  handleUpload,
};