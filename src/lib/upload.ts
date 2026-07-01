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
  const isVercel = process.env.VERCEL === "1";

  if (token) {
    const blob = await put(`${folder}/${filename}`, buffer, {
      access: "public",
      contentType,
    });
    return blob.url;
  }

  if (isVercel) {
    throw new Error(
      "Stockage images non configuré sur Vercel. Créez un store Blob et ajoutez BLOB_READ_WRITE_TOKEN."
    );
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

export function isLocalUploadUrl(url: string): boolean {
  return url.startsWith("/uploads/");
}
