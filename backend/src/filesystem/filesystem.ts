import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

const extensionType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function saveImage(
  buffer: Buffer,
  mimeType: string,
  subfolder: "listings",
): Promise<string> {
  const ext = extensionType;

  if (!ext) {
    throw new Error("Only JPEG, PNG and Webp images are allowed");
  }

  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(UPLOADS_ROOT, subfolder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  return path.posix.join(subfolder, filename);
}

export async function deleteFile(relativePath: string): Promise<void> {
  const normalizedpath = relativePath.replaceAll("\\", "/");

  if (normalizedpath.startsWith("/") || normalizedpath.startsWith("..")) {
    throw new Error("Invalid image path");
  }

  const fullpath = path.join(UPLOADS_ROOT, normalizedpath);
  await fs.rm(fullpath, { force: true });
}
