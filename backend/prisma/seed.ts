import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../src/utils/defaultCategories";

const prisma = new PrismaClient();

async function main() {
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: `default-${cat.name.toLowerCase()}` },
      update: { group: cat.group },
      create: {
        id: `default-${cat.name.toLowerCase()}`,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        group: cat.group,
        kind: "BOTH",
        isDefault: true,
        userId: null,
      },
    });
  }
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
