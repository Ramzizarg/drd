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
      ? Array.from(
          new Set(
            sizes.map((size) => String(size).trim()).filter(Boolean)
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

  const map: ColorSizesMap = {};
  for (const color of colors) {
    map[color] = [...sizes];
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
  return colorSizes[color] ?? fallbackSizes;
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
  const colors = Object.keys(colorSizes);
  const sizes = Array.from(new Set(Object.values(colorSizes).flat()));

  return {
    colorSizes,
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
