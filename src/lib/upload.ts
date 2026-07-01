import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

function sanitizeFilename(filename: string) {
  return filename.replace(/\s+/g, "-").replace(/[^\w.\-]/g, "");
}

export async function uploadFile(
  folder: string,
  originalName: string,
  buffer: Buffer,
  contentType?: string
): Promise<string> {
  const filename = `${Date.now()}-${sanitizeFilename(originalName)}`;
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    const blob = await put(`${folder}/${filename}`, buffer, {
      access: "public",
      contentType,
    });
    return blob.url;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}
