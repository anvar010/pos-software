import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/Topbar";
import { CustomersClient } from "@/components/customers/CustomersClient";
import { serializeCustomer } from "@/lib/serialize";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [customers, store] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
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
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-slate-500">
            Manage customers, view purchase history and loyalty points.
          </p>
        </div>

        <CustomersClient
          initialCustomers={customers.map(serializeCustomer)}
          currency={store?.currency ?? "INR"}
        />
      </main>
    </>
  );
}
