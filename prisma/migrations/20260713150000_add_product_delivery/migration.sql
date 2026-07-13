-- Livraison par produit : gratuite ou avec montant (DT)
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "delivery_type" TEXT NOT NULL DEFAULT 'FREE';

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "delivery_fee" DOUBLE PRECISION;
