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

export function getColorHex(name: string): string {
  return PRODUCT_COLORS.find((c) => c.name === name)?.hex ?? "#d4d4d8";
}

export function parseVariantList(values: FormDataEntryValue[]): string[] {
  return Array.from(new Set(values.map((v) => String(v).trim()).filter(Boolean)));
}
