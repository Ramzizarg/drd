export const PRODUCT_COLORS = [
  { name: "Noir", hex: "#1a1a1a" },
  { name: "Blanc", hex: "#ffffff" },
  { name: "Bleu", hex: "#2563eb" },
  { name: "Rouge", hex: "#dc2626" },
  { name: "Vert", hex: "#16a34a" },
  { name: "Jaune", hex: "#eab308" },
  { name: "Rose", hex: "#ec4899" },
  { name: "Gris", hex: "#6b7280" },
  { name: "Beige", hex: "#d4b896" },
  { name: "Marron", hex: "#78350f" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Violet", hex: "#7c3aed" },
] as const;

export const PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

export type ColorSizesMap = Record<string, string[]>;

const PRODUCT_SIZE_ORDER: Map<string, number> = new Map(
  PRODUCT_SIZES.map((size, index) => [size, index])
);

/** Always order sizes small → large (XS … 3XL); unknown sizes keep relative order at the end. */
export function sortProductSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ai = PRODUCT_SIZE_ORDER.get(a);
    const bi = PRODUCT_SIZE_ORDER.get(b);
    if (ai != null && bi != null) return ai - bi;
    if (ai != null) return -1;
    if (bi != null) return 1;
    return a.localeCompare(b);
  });
}

export function getColorHex(name: string): string {
  return PRODUCT_COLORS.find((c) => c.name === name)?.hex ?? "#d4d4d8";
}

export function parseVariantList(values: FormDataEntryValue[]): string[] {
  return Array.from(new Set(values.map((v) => String(v).trim()).filter(Boolean)));
}

export function normalizeColorSizesMap(raw: unknown): ColorSizesMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const result: ColorSizesMap = {};

  for (const [color, sizes] of Object.entries(raw as Record<string, unknown>)) {
    const trimmedColor = color.trim();
    if (!trimmedColor) continue;

    const normalizedSizes = Array.isArray(sizes)
      ? sortProductSizes(
          Array.from(
            new Set(
              sizes.map((size) => String(size).trim()).filter(Boolean)
            )
          )
        )
      : [];

    if (normalizedSizes.length > 0) {
      result[trimmedColor] = normalizedSizes;
    }
  }

  return result;
}

export function buildColorSizesFromLegacy(
  colors: string[] = [],
  sizes: string[] = []
): ColorSizesMap {
  if (colors.length === 0) return {};

  const sortedSizes = sortProductSizes(sizes);
  const map: ColorSizesMap = {};
  for (const color of colors) {
    map[color] = [...sortedSizes];
  }
  return map;
}

export function resolveProductColorSizes(product: {
  colors?: string[];
  sizes?: string[];
  colorSizes?: unknown;
}): ColorSizesMap {
  const fromJson = normalizeColorSizesMap(product.colorSizes);
  if (Object.keys(fromJson).length > 0) return fromJson;

  return buildColorSizesFromLegacy(product.colors ?? [], product.sizes ?? []);
}

export function getProductColors(colorSizes: ColorSizesMap): string[] {
  return Object.keys(colorSizes);
}

export function getSizesForColor(
  colorSizes: ColorSizesMap,
  color: string,
  fallbackSizes: string[] = []
): string[] {
  if (!color) return [];
  return sortProductSizes(colorSizes[color] ?? fallbackSizes);
}

export function parseColorSizesFromForm(formData: FormData): ColorSizesMap {
  const raw = formData.get("colorSizesJson");
  if (raw != null && String(raw).trim() !== "") {
    try {
      return normalizeColorSizesMap(JSON.parse(String(raw)));
    } catch {
      return {};
    }
  }

  const colors = parseVariantList(formData.getAll("colors"));
  const sizes = parseVariantList(formData.getAll("sizes"));
  return buildColorSizesFromLegacy(colors, sizes);
}

export function colorSizesToDbFields(colorSizes: ColorSizesMap) {
  const normalized = normalizeColorSizesMap(colorSizes);
  const colors = Object.keys(normalized);
  const sizes = sortProductSizes(
    Array.from(new Set(Object.values(normalized).flat()))
  );

  return {
    colorSizes: normalized,
    colors,
    sizes,
  };
}

export function isValidColorSizePair(
  colorSizes: ColorSizesMap,
  color: string,
  size: string
): boolean {
  if (!color || !size) return false;
  const allowed = colorSizes[color];
  return Array.isArray(allowed) && allowed.includes(size);
}
