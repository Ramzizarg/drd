import { prisma } from "@/lib/prisma";

export async function getFirstProductId(): Promise<number | null> {
  const product = await prisma.product.findFirst({
    orderBy: { id: "asc" },
    select: { id: true },
  });
  return product?.id ?? null;
}
