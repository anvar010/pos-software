"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { ReportData } from "@/lib/reports";

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e"];

export function RevenueTrendChart({
  trend,
  currency,
}: {
  trend: ReportData["trend"];
  currency: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={48} />
          <Tooltip
            formatter={(v) => [formatCurrency(Number(v), currency), "Revenue"]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BestSellersChart({
  bestSellers,
}: {
  bestSellers: ReportData["bestSellers"];
}) {
  if (bestSellers.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No sales yet.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={bestSellers}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
            width={110}
          />
          <Tooltip
            formatter={(v) => [`${Number(v)} sold`, "Qty"]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
            {bestSellers.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
