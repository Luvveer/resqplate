import multer from "multer";

const allowedImageType = new Set(["image/jpeg", "image/png", "image/webp"]);

export const listingImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, callback) => {
    if (!allowedImageType.has(file.mimetype)) {
      callback(new Error("Only JPEG, PNG and Webp types are allowed"));
      return;
    }

    callback(null, true);
  },
});
