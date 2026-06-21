import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Topbar } from "@/components/Topbar";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { serializeProduct, serializeStore, serializeCategory } from "@/lib/serialize";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await auth();
  const [products, store, customers, categories] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.store.findUnique({ where: { id: "store" } }),
    prisma.customer.findMany({
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const storeDto = store
    ? serializeStore(store)
    : {
        id: "store",
        name: "My Store",
        address: null,
        phone: null,
        email: null,
        logoUrl: null,
        currency: "INR",
        defaultTaxRate: 0,
        loyaltyRate: 1,
        lowStockDefault: 5,
        receiptFooter: null,
      };

  return (
    <>
      <Topbar />
      <main className="w-full flex-1 px-2 py-2 sm:px-4 sm:py-3">
        <CheckoutClient
          initialProducts={products.map(serializeProduct)}
          categories={categories.map(serializeCategory)}
          store={storeDto}
          customers={customers}
          cashierName={session?.user?.name ?? null}
        />
      </main>
    </>
  );
}
