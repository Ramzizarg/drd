import { prisma } from "@/lib/prisma";

export async function getFirstProductId(): Promise<number | null> {
  if (!process.env.DATABASE_URL?.trim()) {
    return null;
  }

  try {
    const product = await prisma.product.findFirst({
      orderBy: { id: "asc" },
      select: { id: true },
    });
    return product?.id ?? null;
  } catch {
    return null;
  }
}
