import { NextRequest } from "next/server";
import { readBlobMedia } from "@/lib/upload";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const pathname = path.map(decodeURIComponent).join("/");

    const result = await readBlobMedia(pathname);

    if (!result) {
      return new Response("Image introuvable", { status: 404 });
    }

    if (result.statusCode === 304 || !result.stream) {
      return new Response(null, { status: 304 });
    }

    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Error serving blob media", error);
    return new Response("Image introuvable", { status: 404 });
  }
}
