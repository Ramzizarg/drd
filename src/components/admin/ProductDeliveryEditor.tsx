"use client";

import { useState } from "react";

type DeliveryType = "FREE" | "PAID";

type ProductDeliveryEditorProps = {
  initialType?: DeliveryType;
  initialFee?: number | null;
};

export function ProductDeliveryEditor({
  initialType = "FREE",
  initialFee = null,
}: ProductDeliveryEditorProps) {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(
    initialType === "PAID" ? "PAID" : "FREE"
  );

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 p-3">
      <p className="text-xs font-semibold text-zinc-700">Livraison</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
          <input
            type="radio"
            name="deliveryType"
            value="FREE"
            checked={deliveryType === "FREE"}
            onChange={() => setDeliveryType("FREE")}
            className="h-4 w-4 accent-zinc-900"
          />
          Livraison gratuite
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
          <input
            type="radio"
            name="deliveryType"
            value="PAID"
            checked={deliveryType === "PAID"}
            onChange={() => setDeliveryType("PAID")}
            className="h-4 w-4 accent-zinc-900"
          />
          Livraison avec montant
        </label>
      </div>

      {deliveryType === "PAID" && (
        <div className="space-y-1 max-w-[200px]">
          <label className="text-[11px] font-medium text-zinc-700" htmlFor="deliveryFee">
            Montant livraison (DT)
          </label>
          <input
            id="deliveryFee"
            name="deliveryFee"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialFee ?? ""}
            placeholder="ex: 8"
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-xs outline-none focus:border-zinc-900"
          />
        </div>
      )}
    </div>
  );
}
