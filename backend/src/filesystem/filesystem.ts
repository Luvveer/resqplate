import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import sharp from "sharp";

export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

const extensionType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_WIDTH = 1600;

async function resizeImage(buffer: Buffer, minType: string): Promise<Buffer> {
  const pipeline = sharp(buffer)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true });

  switch (minType) {
    case "image/jpeg":
      return pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    case "image/png":
      return pipeline.png({ quality: 80, compressionLevel: 8 }).toBuffer();
    case "image/webp":
      return pipeline.webp({ quality: 80 }).toBuffer();
    default:
      throw new Error("Only JPEG, PNG and Webp images allowed.");
  }
}

export async function saveImage(
  buffer: Buffer,
  mimeType: string,
  subfolder: "listings",
): Promise<string> {
  const ext = extensionType[mimeType];

  if (!ext) {
    throw new Error("Only JPEG, PNG and Webp images are allowed");
  }

  const resized = await resizeImage(buffer, mimeType);

  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(UPLOADS_ROOT, subfolder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), resized);
  return path.posix.join(subfolder, filename);
}

export async function deleteFile(relativePath: string): Promise<void> {
  const normalizedpath = relativePath.replaceAll("\\", "/");

  if (normalizedpath.startsWith("/") || normalizedpath.includes("\0")) {
    throw new Error("Invalid image path");
  }

  const fullpath = path.resolve(UPLOADS_ROOT, normalizedpath);

  const uploadsRootWithSep = path.resolve(UPLOADS_ROOT) + path.sep;

  if (!fullpath.startsWith(uploadsRootWithSep)) {
    throw new Error("Invalid image path");
  }

  await fs.rm(fullpath, { force: true });
}
