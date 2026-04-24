import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Produit #1 Hismile : 55 DT barré → 47,99 DT ; offre 3 unités = prix de 2 (95,98 DT).
 * Produit #2 Ice Roller : prix barrés / prix payés inchangés (voir données ci-dessous).
 */
async function main() {
  const unit = 47.99;

  try {
    const hismile = await prisma.product.update({
      where: { id: 1 },
      data: {
        name: "Hismile",
        price: 55,
        salePrice: unit,
        offer2OriginalPrice: null,
        offer2SalePrice: null,
        offer3OriginalPrice: Math.round(unit * 3 * 100) / 100,
        offer3SalePrice: Math.round(unit * 2 * 100) / 100,
      },
    });
    console.log("Hismile (id 1) mis à jour :", hismile);
  } catch (error) {
    console.error("Hismile id=1 :", error);
  }

  try {
    const ice = await prisma.product.update({
      where: { id: 2 },
      data: {
        name: "Ice Roller",
        price: 34.99,
        salePrice: 24.99,
        offer2OriginalPrice: 64.99,
        offer2SalePrice: 44.99,
        offer3OriginalPrice: 79.99,
        offer3SalePrice: 59.99,
      },
    });
    console.log("Ice Roller (id 2) mis à jour :", ice);
  } catch (error) {
    console.error("Ice Roller id=2 :", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
