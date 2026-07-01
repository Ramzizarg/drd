import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products/[id]
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    // If id is missing or not a valid number, behave as if product does not exist
    if (!idParam || Number.isNaN(id)) {
      return NextResponse.json({ message: "Produit introuvable" }, { status: 404 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { createdAt: "asc" },
        },
        features: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ message: "Produit introuvable" }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error fetching product by id", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
