-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "variant_colors" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "variant_sizes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill from legacy single color/size fields
UPDATE "Order"
SET "variant_colors" = ARRAY["color"]
WHERE "color" IS NOT NULL
  AND cardinality("variant_colors") = 0;

UPDATE "Order"
SET "variant_sizes" = ARRAY["size"]
WHERE "size" IS NOT NULL
  AND cardinality("variant_sizes") = 0;
