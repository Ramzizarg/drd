import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://clara.shop";

  const productEntries: MetadataRoute.Sitemap = [];

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/prisma");
      const products = await prisma.product.findMany({
        select: { id: true, updatedAt: true },
      });

      for (const product of products) {
        productEntries.push({
          url: `${baseUrl}/product/${product.id}`,
          lastModified: product.updatedAt ?? new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    } catch {
      // Skip product URLs if DB is unreachable during build/runtime
    }
  }
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  return [...staticEntries, ...productEntries];
}
