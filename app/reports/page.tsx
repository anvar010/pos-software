import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/Topbar";
import { getReport, type ReportPeriod } from "@/lib/reports";
import { RevenueTrendChart, BestSellersChart } from "@/components/reports/ReportsCharts";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: "day", label: "Today" },
  { key: "week", label: "7 days" },
  { key: "month", label: "30 days" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const period: ReportPeriod =
    sp.period === "day" || sp.period === "month" ? sp.period : "week";

  const [report, store] = await Promise.all([
    getReport(period),
    prisma.store.findUnique({ where: { id: "store" } }),
  ]);
  const currency = store?.currency ?? "USD";

  return (
    <>
      <Topbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link href="/" className="text-sm text-indigo-600 hover:underline">
              ← Home
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Reports</h1>
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {PERIODS.map((p) => (
              <Link
                key={p.key}
                href={`/reports?period=${p.key}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  period === p.key
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Revenue" value={formatCurrency(report.revenue, currency)} accent />
          <Kpi label="Transactions" value={String(report.transactions)} />
          <Kpi label="Avg. sale" value={formatCurrency(report.avgSale, currency)} />
          <Kpi
            label="Inventory value"
            value={formatCurrency(report.stock.inventoryRetailValue, currency)}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card title="Revenue trend">
            <RevenueTrendChart trend={report.trend} currency={currency} />
          </Card>
          <Card title="Best sellers">
            <BestSellersChart bestSellers={report.bestSellers} />
          </Card>

          <Card title="Sales by staff">
            {report.salesByUser.length === 0 ? (
              <Empty />
            ) : (
              <ul className="divide-y divide-slate-100">
                {report.salesByUser.map((u) => (
                  <li key={u.userId} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium">{u.name}</span>
                    <span className="text-slate-500">
                      {u.count} sales ·{" "}
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(u.revenue, currency)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title={`Low / out of stock (${report.stock.lowStock + report.stock.outOfStock})`}
          >
            {report.stock.topLow.length === 0 ? (
              <p className="py-8 text-center text-sm text-emerald-600">
                All products are well stocked 🎉
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {report.stock.topLow.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate">{p.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.stock <= 0
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {p.stock <= 0 ? "Out" : `${p.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${accent ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? "text-indigo-700" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="py-8 text-center text-sm text-slate-400">No data yet.</p>;
}
