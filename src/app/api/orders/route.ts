import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderNotificationEmail } from "@/lib/order-notification";
import { sendMetaPurchaseEvent } from "@/lib/meta-conversions";
import { getItemCountForPack, type PackKey } from "@/lib/product-offers";
import {
  getProductColors,
  isValidColorSizePair,
  resolveProductColorSizes,
} from "@/lib/product-options";

function normalizeVariantList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => String(value).trim()).filter(Boolean);
}

function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return req.headers.get("x-real-ip") || undefined;
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
      eventId,
      eventSourceUrl,
      fbp,
      fbc,
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
      select: { name: true, colors: true, sizes: true, colorSizes: true },
    });

    if (!product) {
      return NextResponse.json({ message: "Produit introuvable" }, { status: 404 });
    }

    const colorSizes = resolveProductColorSizes(product);
    const availableColors = getProductColors(colorSizes);
    const expectedCount = getItemCountForPack(packNumber as PackKey);
    let colors = normalizeVariantList(variantColors);
    let sizes = normalizeVariantList(variantSizes);

    if (colors.length === 0 && color != null && String(color).trim() !== "") {
      colors = [String(color).trim()];
    }

    if (sizes.length === 0 && size != null && String(size).trim() !== "") {
      sizes = [String(size).trim()];
    }

    if (availableColors.length > 0) {
      if (colors.length !== expectedCount) {
        return NextResponse.json(
          {
            message: `Merci de choisir une couleur pour chaque article (${expectedCount} requis).`,
          },
          { status: 400 }
        );
      }

      for (const selectedColor of colors) {
        if (!availableColors.includes(selectedColor)) {
          return NextResponse.json({ message: "Couleur invalide" }, { status: 400 });
        }
      }
    } else {
      colors = [];
    }

    const requiresSizes = Object.values(colorSizes).some((entries) => entries.length > 0);

    if (requiresSizes) {
      if (sizes.length !== expectedCount) {
        return NextResponse.json(
          {
            message: `Merci de choisir une taille pour chaque article (${expectedCount} requis).`,
          },
          { status: 400 }
        );
      }

      for (let i = 0; i < sizes.length; i++) {
        const selectedColor = colors[i] ?? colors[0] ?? "";
        const selectedSize = sizes[i];

        if (!isValidColorSizePair(colorSizes, selectedColor, selectedSize)) {
          return NextResponse.json(
            { message: `Taille invalide pour la couleur ${selectedColor}.` },
            { status: 400 }
          );
        }
      }
    } else {
      sizes = [];
    }

    const orderTotal = Number(total);
    const order = await prisma.order.create({
      data: {
        productId: Number(productId),
        pack: packNumber,
        total: orderTotal,
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

    const purchaseEventId =
      eventId && String(eventId).trim() !== ""
        ? String(eventId)
        : `order_${order.id}_${Date.now()}`;

    void sendMetaPurchaseEvent({
      eventId: purchaseEventId,
      value: orderTotal,
      currency: "TND",
      contentIds: [String(productId)],
      contentName: product.name,
      numItems: expectedCount,
      phone: String(phone),
      name: String(name),
      eventSourceUrl:
        eventSourceUrl && String(eventSourceUrl).trim() !== ""
          ? String(eventSourceUrl)
          : undefined,
      clientIpAddress: getClientIp(req),
      clientUserAgent: req.headers.get("user-agent") || undefined,
      fbp: fbp ? String(fbp) : null,
      fbc: fbc ? String(fbc) : null,
    });

    void sendOrderNotificationEmail({
      productName: product.name,
      productId: Number(productId),
      pack: packNumber,
      total: orderTotal,
      name: String(name),
      phone: String(phone),
      address: String(address),
      governor: String(governor),
      city: city != null && String(city).trim() !== "" ? String(city) : "",
      variantColors: colors,
      variantSizes: sizes,
    });

    return NextResponse.json(
      { message: "ok", orderId: order.id, eventId: purchaseEventId },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating order", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
