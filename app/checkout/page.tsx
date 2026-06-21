import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Topbar } from "@/components/Topbar";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { serializeProduct, serializeStore } from "@/lib/serialize";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await auth();
  const [products, store, customers] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.store.findUnique({ where: { id: "store" } }),
    prisma.customer.findMany({
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
    }),
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
        currency: "USD",
        defaultTaxRate: 0,
        loyaltyRate: 1,
        lowStockDefault: 5,
        receiptFooter: null,
      };

  return (
    <>
      <Topbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-indigo-600 hover:underline">
              ← Home
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
          </div>
        </div>

        <CheckoutClient
          initialProducts={products.map(serializeProduct)}
          store={storeDto}
          customers={customers}
          cashierName={session?.user?.name ?? null}
        />
      </main>
    </>
  );
}
