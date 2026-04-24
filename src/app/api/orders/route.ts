import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    } = body || {};

    if (!productId || !pack || !total || !name || !phone || !address || !governor) {
      return NextResponse.json({ message: "Champs manquants" }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        productId: Number(productId),
        pack: Number(pack),
        total: Number(total),
        name: String(name),
        phone: String(phone),
        address: String(address),
        governor: String(governor),
        city: city != null && String(city).trim() !== "" ? String(city) : "",
      },
    });

    return NextResponse.json({ message: "ok", orderId: order.id }, { status: 201 });
  } catch (err) {
    console.error("Error creating order", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
