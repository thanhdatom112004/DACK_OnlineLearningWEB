const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadRoot = path.join(__dirname, "..", "uploads", "chat");
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadRoot);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".bin";
    const fileName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, fileName);
  },
});

function imageFileFilter(req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Chi chap nhan file anh"));
  }
}

module.exports = {
  uploadChatImage: multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter,
  }),
  getChatUploadRelativeUrl(filename) {
    if (!filename) return "";
    return "/uploads/chat/" + filename;
  },
};
