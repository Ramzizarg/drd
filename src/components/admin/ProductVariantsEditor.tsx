"use client";

import { useMemo, useState } from "react";
import {
  PRODUCT_COLORS,
  PRODUCT_SIZES,
  type ColorSizesMap,
  getColorHex,
  normalizeColorSizesMap,
} from "@/lib/product-options";

type ProductVariantsEditorProps = {
  initialColorSizes?: ColorSizesMap;
  initialColors?: string[];
  initialSizes?: string[];
};

function buildInitialState(
  initialColorSizes?: ColorSizesMap,
  initialColors: string[] = [],
  initialSizes: string[] = []
): ColorSizesMap {
  const fromProp = normalizeColorSizesMap(initialColorSizes);
  if (Object.keys(fromProp).length > 0) return fromProp;

  const map: ColorSizesMap = {};
  for (const color of initialColors) {
    map[color] = [...initialSizes];
  }
  return map;
}

export function ProductVariantsEditor({
  initialColorSizes,
  initialColors = [],
  initialSizes = [],
}: ProductVariantsEditorProps) {
  const [colorSizes, setColorSizes] = useState<ColorSizesMap>(() =>
    buildInitialState(initialColorSizes, initialColors, initialSizes)
  );

  const activeColors = useMemo(() => Object.keys(colorSizes), [colorSizes]);
  const jsonValue = useMemo(() => JSON.stringify(colorSizes), [colorSizes]);

  const toggleColor = (colorName: string, enabled: boolean) => {
    setColorSizes((current) => {
      const next = { ...current };
      if (enabled) {
        if (!next[colorName]) next[colorName] = [];
      } else {
        delete next[colorName];
      }
      return next;
    });
  };

  const toggleSize = (colorName: string, size: string, enabled: boolean) => {
    setColorSizes((current) => {
      const currentSizes = current[colorName] ?? [];
      const nextSizes = enabled
        ? Array.from(new Set([...currentSizes, size]))
        : currentSizes.filter((entry) => entry !== size);

      return {
        ...current,
        [colorName]: nextSizes,
      };
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 p-4">
      <input type="hidden" name="colorSizesJson" value={jsonValue} />

      <div>
        <p className="text-sm font-medium text-zinc-800">Couleurs du produit</p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Activez une couleur, puis choisissez les tailles disponibles pour cette couleur.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRODUCT_COLORS.map((color) => {
            const isActive = activeColors.includes(color.name);
            return (
              <label
                key={color.name}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  isActive
                    ? "border-[#ff6b00] bg-[#fff7ec]"
                    : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => toggleColor(color.name, e.target.checked)}
                  className="rounded border-zinc-300"
                />
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-zinc-300"
                  style={{ backgroundColor: color.hex }}
                />
                <span>{color.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {activeColors.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-800">Tailles par couleur</p>
          {activeColors.map((colorName) => {
            const selectedSizes = new Set(colorSizes[colorName] ?? []);
            return (
              <div
                key={colorName}
                className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded-full border border-zinc-300"
                    style={{ backgroundColor: getColorHex(colorName) }}
                  />
                  <p className="text-sm font-semibold text-zinc-900">{colorName}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_SIZES.map((size) => (
                    <label
                      key={`${colorName}-${size}`}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        selectedSizes.has(size)
                          ? "border-[#ff6b00] bg-white text-[#ff6b00]"
                          : "border-zinc-200 bg-white hover:border-zinc-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSizes.has(size)}
                        onChange={(e) =>
                          toggleSize(colorName, size, e.target.checked)
                        }
                        className="rounded border-zinc-300"
                      />
                      {size}
                    </label>
                  ))}
                </div>
                {selectedSizes.size === 0 && (
                  <p className="mt-2 text-[11px] text-amber-700">
                    Choisissez au moins une taille pour {colorName}.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
