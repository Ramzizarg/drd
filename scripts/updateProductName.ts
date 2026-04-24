import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateProductName() {
  try {
    const product = await prisma.product.findFirst();

    if (!product) {
      console.log("No product found in the database.");
      return;
    }

    const unit = 47.99;
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: {
        name: "Hismile",
        price: unit,
        salePrice: null,
        offer2OriginalPrice: null,
        offer2SalePrice: null,
        // 3 unités = prix de 2 (3ᵉ gratuit)
        offer3OriginalPrice: Math.round(unit * 3 * 100) / 100,
        offer3SalePrice: Math.round(unit * 2 * 100) / 100,
      },
    });

    console.log("Product updated successfully:", updatedProduct);
  } catch (error) {
    console.error("Error updating product name:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProductName();
