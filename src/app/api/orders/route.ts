import { NextRequest, NextResponse } from "next/server";
import { getItemCountForPack, type PackKey } from "@/lib/product-offers";
import { prisma } from "@/lib/prisma";

function normalizeVariantList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => String(value).trim()).filter(Boolean);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      productId,
      pack,
      total,
      name,
      phone,
      address,
      governor,
      city,
      color,
      size,
      variantColors,
      variantSizes,
    } = body || {};

    if (!productId || !pack || !total || !name || !phone || !address || !governor) {
      return NextResponse.json({ message: "Champs manquants" }, { status: 400 });
    }

    const packNumber = Number(pack);
    if (![1, 2, 3].includes(packNumber)) {
      return NextResponse.json({ message: "Offre invalide" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
      select: { colors: true, sizes: true },
    });

    if (!product) {
      return NextResponse.json({ message: "Produit introuvable" }, { status: 404 });
    }

    const expectedCount = getItemCountForPack(packNumber as PackKey);
    let colors = normalizeVariantList(variantColors);
    let sizes = normalizeVariantList(variantSizes);

    if (colors.length === 0 && color != null && String(color).trim() !== "") {
      colors = [String(color).trim()];
    }

    if (sizes.length === 0 && size != null && String(size).trim() !== "") {
      sizes = [String(size).trim()];
    }

    if (product.colors.length > 0) {
      if (colors.length !== expectedCount) {
        return NextResponse.json(
          { message: `Merci de choisir une couleur pour chaque article (${expectedCount} requis).` },
          { status: 400 }
        );
      }

      for (const selectedColor of colors) {
        if (!product.colors.includes(selectedColor)) {
          return NextResponse.json({ message: "Couleur invalide" }, { status: 400 });
        }
      }
    } else {
      colors = [];
    }

    if (product.sizes.length > 0) {
      if (sizes.length !== expectedCount) {
        return NextResponse.json(
          { message: `Merci de choisir une taille pour chaque article (${expectedCount} requis).` },
          { status: 400 }
        );
      }

      for (const selectedSize of sizes) {
        if (!product.sizes.includes(selectedSize)) {
          return NextResponse.json({ message: "Taille invalide" }, { status: 400 });
        }
      }
    } else {
      sizes = [];
    }

    const order = await prisma.order.create({
      data: {
        productId: Number(productId),
        pack: packNumber,
        total: Number(total),
        name: String(name),
        phone: String(phone),
        address: String(address),
        governor: String(governor),
        city: city != null && String(city).trim() !== "" ? String(city) : "",
        color: colors[0] ?? null,
        size: sizes[0] ?? null,
        variantColors: colors,
        variantSizes: sizes,
      },
    });

    return NextResponse.json({ message: "ok", orderId: order.id }, { status: 201 });
  } catch (err) {
    console.error("Error creating order", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
