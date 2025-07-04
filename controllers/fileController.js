const query = require("../prisma/queries");
const path = require("node:path");
const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const bucketName = process.env.BUCKET_NAME;
const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const getFileUrl = async (req, res) => {
  try {
    const fileId = parseInt(req.params.fileId);
    const folderId = parseInt(req.params.folderId);
    const mode = req.path.includes("/download") ? "download" : "view";

    const file = await query.getFileById(fileId);

    if (!file || file.user_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (file.folder_id !== folderId) {
      return res.status(400).json({ message: "Folder mismatch" });
    }

    const contentDisposition =
      mode === "download" ? `attachment; filename="${file.name}"` : `inline; filename="${file.name}"`;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: `uploads/${file.user_id}/${file.public_id}`,
      ResponseContentDisposition: contentDisposition,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    if (mode === "download") {
      return res.json({ url: signedUrl });
    } else {
      return res.redirect(signedUrl);
    }
  } catch (err) {
    console.error("Error generating signed URL:", err);
    return res.status(500).json({ message: "Failed to get file URL" });
  }
};

const getShareableUrl = async (req, res) => {
  try {
    const fileId = parseInt(req.params.fileId);
    const folderId = parseInt(req.params.folderId);

    const file = await query.getFileById(fileId);

    if (!file || file.user_id !== req.user.id || file.folder_id !== folderId) {
      return res.status(403).json({ message: "Unauthorized or file not found" });
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: `uploads/${file.user_id}/${file.public_id}`,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 60 * 24 }); // 24 hours

    return res.json({ url: signedUrl });
  } catch (err) {
    console.error("Error generating shareable link:", err);
    return res.status(500).json({ message: "Failed to generate shareable link" });
  }
};

const handleUpload = async (req, res) => {
  try {
    const userId = req.user.id;
    const folderId = parseInt(req.params.folderId);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const publicId = `${Date.now()}-${req.file.originalname}`;
    const fileUrl = `https://${bucketName}.s3.${process.env.BUCKET_REGION}.amazonaws.com/uploads/${userId}/${publicId}`;

    await query.handleFileUpload(req.file.originalname, req.file.size, fileUrl, publicId, userId, folderId);

    const params = {
      Bucket: bucketName,
      Key: `uploads/${userId}/${publicId}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };
    const command = new PutObjectCommand(params);
    await s3.send(command);

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

    await query.deleteFile(fileId);

    const deleteParams = {
      Bucket: bucketName,
      Key: `uploads/${file.user_id}/${file.public_id}`,
    };
    const deleteCommand = new DeleteObjectCommand(deleteParams);
    await s3.send(deleteCommand);

    res.redirect(`/folder/${file.folder_id}`);
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "An error occurred while deleting the file." });
  }
};

module.exports = {
  getFileUrl,
  getShareableUrl,
  handleUpload,
  handleDelete,
};
