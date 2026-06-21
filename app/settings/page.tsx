import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/Topbar";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { serializeStore, serializeCategory } from "@/lib/serialize";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [store, categories] = await Promise.all([
    prisma.store.upsert({ where: { id: "store" }, update: {}, create: { id: "store" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Topbar />
      <main className="w-full flex-1 px-4 py-6 sm:px-6">
        <div className="mb-5">
          <Link href="/" className="text-sm text-indigo-600 hover:underline">
            ← Home
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500">
            Store info, tax &amp; loyalty defaults, receipt template and categories.
          </p>
        </div>

        <SettingsClient
          store={serializeStore(store)}
          categories={categories.map(serializeCategory)}
        />
      </main>
    </>
  );
}
