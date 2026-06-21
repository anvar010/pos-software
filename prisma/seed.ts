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
  const categoryNames = ["Beverages", "Snacks", "Groceries", "Household"];
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
    { name: "Bottled Water 500ml", sku: "BEV-001", barcode: "1000000000017", price: 1.0, costPrice: 0.4, stockQuantity: 120, category: "Beverages" },
    { name: "Cola Can 330ml", sku: "BEV-002", barcode: "1000000000024", price: 1.5, costPrice: 0.7, stockQuantity: 80, category: "Beverages" },
    { name: "Potato Chips", sku: "SNK-001", barcode: "1000000000031", price: 2.25, costPrice: 1.1, stockQuantity: 60, category: "Snacks" },
    { name: "Chocolate Bar", sku: "SNK-002", barcode: "1000000000048", price: 1.75, costPrice: 0.8, stockQuantity: 4, category: "Snacks" },
    { name: "White Rice 1kg", sku: "GRO-001", barcode: "1000000000055", price: 3.5, costPrice: 2.0, stockQuantity: 40, category: "Groceries" },
    { name: "Dish Soap 500ml", sku: "HHD-001", barcode: "1000000000062", price: 2.99, costPrice: 1.5, stockQuantity: 25, category: "Household" },
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
