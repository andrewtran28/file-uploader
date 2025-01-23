const query = require("../prisma/queries");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const handleUpload = async (req, res) => {
  try {
    const userId = req.user.id;
    const folderId = parseInt(req.params.folderId);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    //Formats file Buffer for Cloudinary upload
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
        folder: `upsidedownload/${userId}`,
        resource_type: "auto",  // This automatically detects file type (image, video, etc.)
        public_id: `${Date.now()}-${req.file.originalname}`,
      });

    if (result.bytes > 3 * 1024 * 1024) {
      return res.status(400).json({ message: "File size exceeds 3MB." });
    }

    await query.handleFileUpload(
      req.file.originalname,
      req.file.size,
      result.url,
      result.public_id,
      userId,
      folderId,
    );

    console.log("File uploaded successfully:", req.file);

    res.redirect(`/folder/${folderId}`);
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).send("An error occurred while uploading the file.");
  }
};

const handleDelete = async (req, res) => {
  try {
    const fileId = parseInt(req.body.fileId);
    const file = await query.getFileById(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    //Cloudinary requires the resource_type for destroying assets.
    const fileExtension = file.name.split('.').pop().toLowerCase();
    let resourceType;
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
      resourceType = "image";
    } else if (['mp4', 'mov', 'avi', 'mkv', 'mp3'].includes(fileExtension)) {
      resourceType = "video";
    } else {
      resourceType = "raw";
    }

    const cloudinaryResponse = await cloudinary.uploader.destroy(file.public_id, {
      resource_type: resourceType,
    });

    if (cloudinaryResponse.result !== 'ok') {
      return res.status(500).send("Error deleting file from Cloudinary.");
    }

    await query.deleteFile(fileId);
    res.redirect(`/folder/${file.folder_id}`);
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "An error occurred while deleting the file." });
  }
};

module.exports = {
  handleUpload,
  handleDelete,
};
