const { PrismaNeon } = require("@prisma/adapter-neon");
const { neonConfig } = require("@neondatabase/serverless");
const { PrismaClient } = require("@prisma/client");
const ws = require("ws");

require("dotenv").config();

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const products = [
  {
    name: "Hismile",
    description:
      "Kit de blanchiment des dents Hismile pour un sourire éclatant. Formule douce et résultats visibles rapidement.",
    price: 55,
    salePrice: 47.99,
    imageUrl:
      "https://images.pexels.com/photos/3845457/pexels-photo-3845457.jpeg?auto=compress&cs=tinysrgb&w=1200",
    offer3OriginalPrice: 143.97,
    offer3SalePrice: 95.98,
  },
  {
    name: "Ice Roller",
    description:
      "Rouleau glacial Ice Roller pour décongestionner, apaiser la peau et réduire les poches. Idéal pour votre routine beauté quotidienne.",
    price: 34.99,
    salePrice: 24.99,
    imageUrl:
      "https://images.pexels.com/photos/6634642/pexels-photo-6634642.jpeg?auto=compress&cs=tinysrgb&w=1200",
    offer2OriginalPrice: 64.99,
    offer2SalePrice: 44.99,
    offer3OriginalPrice: 79.99,
    offer3SalePrice: 59.99,
  },
];

async function main() {
  const existing = await prisma.product.findFirst();

  if (existing) {
    console.log("Products already exist:", existing.name);
    return;
  }

  for (const product of products) {
    const created = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice,
        imageUrl: product.imageUrl,
        offer2OriginalPrice: product.offer2OriginalPrice ?? null,
        offer2SalePrice: product.offer2SalePrice ?? null,
        offer3OriginalPrice: product.offer3OriginalPrice ?? null,
        offer3SalePrice: product.offer3SalePrice ?? null,
        images: {
          create: [{ url: product.imageUrl, isPrimary: true }],
        },
      },
    });

    console.log("Seeded product:", created.name, `(id ${created.id})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
