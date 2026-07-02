import { get, put, type BlobAccessType } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

function sanitizeFilename(filename: string) {
  return filename.replace(/\s+/g, "-").replace(/[^\w.\-]/g, "");
}

function getBlobAccess(): BlobAccessType {
  const access = process.env.BLOB_ACCESS?.trim().toLowerCase();
  if (access === "public" || access === "private") {
    return access;
  }
  return "private";
}

export function toBlobMediaUrl(pathname: string): string {
  return `/api/blob/${pathname.split("/").map(encodeURIComponent).join("/")}`;
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
    const access = getBlobAccess();
    const blob = await put(`${folder}/${filename}`, buffer, {
      access,
      contentType,
      addRandomSuffix: true,
    });

    if (access === "private") {
      return toBlobMediaUrl(blob.pathname);
    }

    return blob.url;
  }

  if (isVercel) {
    throw new Error(
      "Stockage images non configuré sur Vercel. Allez dans Vercel → Storage → Blob, connectez le store au projet, puis redeployez."
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

export function isBlobMediaUrl(url: string): boolean {
  return url.startsWith("/api/blob/");
}

export async function readBlobMedia(pathname: string) {
  return get(pathname, { access: getBlobAccess() });
}
