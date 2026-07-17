import multer from "multer";
import type { NextFunction, Request, Response } from "express";
const allowedImageType = new Set(["image/jpeg", "image/png", "image/webp"]);

export const listingImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedImageType.has(file.mimetype)) {
      callback(new Error("Only JPEG, PNG and Webp types are allowed"));
      return;
    }

    callback(null, true);
  },
});

export function uploadSingleImage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  listingImageUpload.single("image")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      res.status(400).json({ error: "Image cannot be larger than 5MB" });
      return;
    }

    if (error instanceof multer.MulterError) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to upload Image",
    });
  });
}
