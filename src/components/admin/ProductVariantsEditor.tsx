"use client";

import { PRODUCT_COLORS, PRODUCT_SIZES } from "@/lib/product-options";

type ProductVariantsEditorProps = {
  initialColors?: string[];
  initialSizes?: string[];
};

export function ProductVariantsEditor({
  initialColors = [],
  initialSizes = [],
}: ProductVariantsEditorProps) {
  const selectedColors = new Set(initialColors);
  const selectedSizes = new Set(initialSizes);

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 p-4">
      <div>
        <p className="text-sm font-medium text-zinc-800">Couleurs disponibles</p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Cochez les couleurs proposées au client (ex. t-shirt).
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRODUCT_COLORS.map((color) => (
            <label
              key={color.name}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
            >
              <input
                type="checkbox"
                name="colors"
                value={color.name}
                defaultChecked={selectedColors.has(color.name)}
                className="rounded border-zinc-300"
              />
              <span
                className="h-4 w-4 shrink-0 rounded-full border border-zinc-300"
                style={{ backgroundColor: color.hex }}
              />
              <span>{color.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-800">Tailles disponibles</p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Cochez les tailles proposées au client.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRODUCT_SIZES.map((size) => (
            <label
              key={size}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
            >
              <input
                type="checkbox"
                name="sizes"
                value={size}
                defaultChecked={selectedSizes.has(size)}
                className="rounded border-zinc-300"
              />
              <span className="font-medium">{size}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
