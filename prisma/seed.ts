import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@pos.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const name = process.env.SEED_ADMIN_NAME ?? "Store Admin";

  // --- Admin user -----------------------------------------------------------
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash, role: "admin" },
  });
  console.log(`✔ Admin user ready: ${admin.email}`);

  // --- Store settings (singleton) -------------------------------------------
  await prisma.store.upsert({
    where: { id: "store" },
    update: {},
    create: { id: "store", name: "My Retail Store", defaultTaxRate: 0, currency: "INR" },
  });
  console.log("✔ Store settings ready");

  // --- Sample categories ----------------------------------------------------
  const categoryNames = [
    "Vegetables",
    "Fruits",
    "Cool Drinks",
    "Dairy",
    "Snacks",
    "Bakery",
    "Groceries",
    "Household",
    "Personal Care",
  ];
  const categories = await Promise.all(
    categoryNames.map((cName) =>
      prisma.category.upsert({
        where: { name: cName },
        update: {},
        create: { name: cName },
      })
    )
  );
  console.log(`✔ ${categories.length} categories ready`);

  // --- Sample products ------------------------------------------------------
  const sampleProducts = [
    { name: "Tomato 1kg", sku: "VEG-001", barcode: "1000000000017", price: 30, costPrice: 18, stockQuantity: 120, category: "Vegetables" },
    { name: "Onion 1kg", sku: "VEG-002", barcode: "1000000000024", price: 40, costPrice: 25, stockQuantity: 90, category: "Vegetables" },
    { name: "Banana (dozen)", sku: "FRT-001", barcode: "1000000000031", price: 50, costPrice: 32, stockQuantity: 60, category: "Fruits" },
    { name: "Coca-Cola 750ml", sku: "CLD-001", barcode: "1000000000048", price: 45, costPrice: 32, stockQuantity: 80, category: "Cool Drinks" },
    { name: "Milk 1L", sku: "DRY-001", barcode: "1000000000055", price: 60, costPrice: 48, stockQuantity: 40, category: "Dairy" },
    { name: "Potato Chips", sku: "SNK-001", barcode: "1000000000062", price: 20, costPrice: 12, stockQuantity: 4, category: "Snacks" },
    { name: "White Bread", sku: "BKY-001", barcode: "1000000000079", price: 35, costPrice: 22, stockQuantity: 25, category: "Bakery" },
    { name: "Dish Soap 500ml", sku: "HHD-001", barcode: "1000000000086", price: 99, costPrice: 60, stockQuantity: 25, category: "Household" },
  ];

  const catByName = new Map(categories.map((c) => [c.name, c.id]));
  for (const p of sampleProducts) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        price: p.price,
        costPrice: p.costPrice,
        stockQuantity: p.stockQuantity,
        categoryId: catByName.get(p.category) ?? null,
      },
    });
  }
  console.log(`✔ ${sampleProducts.length} sample products ready`);
  console.log("\n🌱 Seed complete. Login with:");
  console.log(`   email:    ${email}`);
  console.log(`   password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
