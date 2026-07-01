export type PackKey = 1 | 2 | 3;

type OfferProduct = {
  price: number;
  salePrice?: number | null;
  offer2OriginalPrice?: number | null;
  offer2SalePrice?: number | null;
  offer3OriginalPrice?: number | null;
  offer3SalePrice?: number | null;
};

function isValidPrice(value?: number | null): value is number {
  return value != null && !Number.isNaN(value);
}

export function hasPackOffer(product: OfferProduct, pack: 2 | 3): boolean {
  if (pack === 2) {
    return (
      isValidPrice(product.offer2SalePrice) ||
      isValidPrice(product.offer2OriginalPrice)
    );
  }

  return (
    isValidPrice(product.offer3SalePrice) ||
    isValidPrice(product.offer3OriginalPrice)
  );
}

export function getPackLineup(product: OfferProduct): PackKey[] {
  const lineup: PackKey[] = [1];
  if (hasPackOffer(product, 2)) lineup.push(2);
  if (hasPackOffer(product, 3)) lineup.push(3);
  return lineup;
}

export function getPackPrices(product: OfferProduct): Record<
  PackKey,
  { label: string; original: number | null; sale: number }
> {
  return {
    1: {
      label: "1x",
      original: product.price,
      sale: isValidPrice(product.salePrice) ? product.salePrice : product.price,
    },
    2: {
      label: "2x",
      original: isValidPrice(product.offer2OriginalPrice)
        ? product.offer2OriginalPrice
        : product.price * 2,
      sale: isValidPrice(product.offer2SalePrice)
        ? product.offer2SalePrice
        : isValidPrice(product.offer2OriginalPrice)
          ? product.offer2OriginalPrice
          : product.price * 2,
    },
    3: {
      label: "3x",
      original: isValidPrice(product.offer3OriginalPrice)
        ? product.offer3OriginalPrice
        : product.price * 3,
      sale: isValidPrice(product.offer3SalePrice)
        ? product.offer3SalePrice
        : isValidPrice(product.offer3OriginalPrice)
          ? product.offer3OriginalPrice
          : product.price * 3,
    },
  };
}

export function isThreeForTwoOffer(product: OfferProduct): boolean {
  const unitSale = isValidPrice(product.salePrice) ? product.salePrice : product.price;

  return (
    isValidPrice(product.offer3SalePrice) &&
    isValidPrice(product.offer3OriginalPrice) &&
    Math.abs(product.offer3SalePrice - 2 * unitSale) < 0.05 &&
    Math.abs(product.offer3OriginalPrice - 3 * unitSale) < 0.05
  );
}

/** Number of physical items the customer picks color/size for (matches pack size). */
export function getItemCountForPack(pack: PackKey): number {
  return pack;
}

export type VariantSelection = { color: string; size: string };

export function createDefaultVariants(
  count: number,
  colorSizes: Record<string, string[]> = {}
): VariantSelection[] {
  const colors = Object.keys(colorSizes);
  const firstColor = colors[0] ?? "";
  const firstSize = colorSizes[firstColor]?.[0] ?? "";

  return Array.from({ length: count }, () => ({
    color: firstColor,
    size: firstSize,
  }));
}

export function formatVariantSelections(
  colors: string[],
  sizes: string[]
): string {
  const count = Math.max(colors.length, sizes.length);
  const parts: string[] = [];

  for (let i = 0; i < count; i++) {
    const details = [
      colors[i] ? `Couleur: ${colors[i]}` : "",
      sizes[i] ? `Taille: ${sizes[i]}` : "",
    ].filter(Boolean);

    if (details.length > 0) {
      parts.push(
        count > 1 ? `Article ${i + 1}: ${details.join(" · ")}` : details.join(" · ")
      );
    }
  }

  return parts.join(" | ");
}
