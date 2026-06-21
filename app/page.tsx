import Link from "next/link";
import { Topbar } from "@/components/Topbar";

const tiles = [
  { href: "/checkout", label: "Checkout", desc: "Ring up a sale", emoji: "🧾" },
  { href: "/inventory", label: "Inventory", desc: "Products & stock", emoji: "📦" },
  { href: "/customers", label: "Customers", desc: "Loyalty & history", emoji: "👤" },
  { href: "/reports", label: "Reports", desc: "Sales & insights", emoji: "📊" },
  { href: "/settings", label: "Settings", desc: "Store & receipts", emoji: "⚙️" },
];

export default function HomePage() {
  return (
    <>
      <Topbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <header className="mb-10">
        <p className="text-sm font-medium text-indigo-600">Retail POS</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          Point of Sale
        </h1>
        <p className="mt-2 text-slate-600">
          Fast, installable, works online &amp; offline.
        </p>
      </header>

      <nav className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md active:scale-[0.98]"
          >
            <div className="text-3xl">{t.emoji}</div>
            <div className="mt-3 text-lg font-semibold group-hover:text-indigo-700">
              {t.label}
            </div>
            <div className="text-sm text-slate-500">{t.desc}</div>
          </Link>
        ))}
      </nav>

      <p className="mt-10 text-center text-xs text-slate-400">
        Signed in · Inventory &amp; checkout coming next
      </p>
      </main>
    </>
  );
}
