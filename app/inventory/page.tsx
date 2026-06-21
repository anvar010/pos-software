import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/Topbar";
import { InventoryClient } from "@/components/inventory/InventoryClient";
import { serializeProduct, serializeCategory } from "@/lib/serialize";

export const metadata: Metadata = { title: "Inventory" };

// Always reflect the latest stock.
export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [products, categories, store] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.store.findUnique({ where: { id: "store" } }),
  ]);

  return (
    <>
      <Topbar />
      <main className="w-full flex-1 px-4 py-6 sm:px-6">
        <div className="mb-5">
          <Link href="/" className="text-sm text-indigo-600 hover:underline">
            ← Home
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-500">
            Manage products, stock levels and categories.
          </p>
        </div>

        <InventoryClient
          initialProducts={products.map(serializeProduct)}
          categories={categories.map(serializeCategory)}
          currency={store?.currency ?? "INR"}
        />
      </main>
    </>
  );
}
