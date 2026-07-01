-- Tailles disponibles par couleur (ex: {"Rouge":["M","L","XL"],"Bleu":["S","M","L"]})
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "color_sizes" JSONB NOT NULL DEFAULT '{}'::jsonb;
