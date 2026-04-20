import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

const defaultSiteUrl = "https://clara.shop";

function getSiteOrigin(): string {
  let raw = (process.env.NEXT_PUBLIC_SITE_URL || defaultSiteUrl).trim();
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    raw = `https://${raw.replace(/^\/+/, "")}`;
  }
  return new URL(raw).origin;
}

function toAbsoluteImageUrl(siteOrigin: string, path: string | null | undefined) {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = siteOrigin.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${p}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const siteOrigin = getSiteOrigin();
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!idParam || Number.isNaN(id)) {
    return {
      title: "Produit introuvable | Clara",
      robots: { index: false, follow: true },
    };
  }

  let product: {
    name: string;
    description: string;
    price: number;
    salePrice: number | null;
    imageUrl: string;
    images: { url: string; isPrimary: boolean }[];
  } | null = null;

  try {
    product = await prisma.product.findUnique({
      where: { id },
      select: {
        name: true,
        description: true,
        price: true,
        salePrice: true,
        imageUrl: true,
        images: {
          orderBy: { createdAt: "asc" },
          select: { url: true, isPrimary: true },
        },
      },
    });
  } catch {
    return { title: "Clara | Boutique officielle" };
  }

  if (!product) {
    return {
      title: "Produit introuvable | Clara",
      robots: { index: false, follow: true },
    };
  }

  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const imageCandidate = primary?.url || product.imageUrl;
  const ogImage =
    toAbsoluteImageUrl(siteOrigin, imageCandidate) ?? `${siteOrigin}/Carla.png`;

  const title = `${product.name} | Clara`;
  const plainDescription = product.description.replace(/\s+/g, " ").trim();
  const description =
    plainDescription.length > 155
      ? `${plainDescription.slice(0, 152)}...`
      : plainDescription || `Commandez ${product.name} sur Clara.`;

  const canonical = `${siteOrigin}/product/${id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "Clara",
      locale: "fr_FR",
      title,
      description,
      images: [{ url: ogImage, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function ProductIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
