import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const fileTypesMap = {
  image: ["image/jpeg", "image/png", "image/webp"],
  pdf: ["application/pdf"],
  cpp: ["text/x-c++src", "text/plain"],
  video: ["video/mp4", "video/mkv"]
};

const uploadFile = (
  folder = "general",
  allowedTypes = ["image"],
  maxSizeMB = 5 
) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = `uploads/${folder}`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },

    filename: (req, file, cb) => {
      const uniqueName =
        Date.now() +
        "-" +
        crypto.randomBytes(6).toString("hex") +
        path.extname(file.originalname);

      cb(null, uniqueName);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedMimes = allowedTypes.flatMap(
      (type) => fileTypesMap[type] || []
    );

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`الأنواع المسموحة فقط هي: ${allowedTypes.join(", ")}`), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 } 
  });
};

export default uploadFile;