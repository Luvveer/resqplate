import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

export async function saveFile(
  buffer: Buffer,
  originName: string,
  subfolder: string,
): Promise<string> {
  const ext = path.extname(originName);
  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(UPLOADS_ROOT, subfolder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  return path.join(subfolder, filename);
}

export async function deleteFile(relativepath: string): Promise<void> {
  const fullpath = path.join(UPLOADS_ROOT, relativepath);
  await fs.rm(fullpath, { force: true });
}
