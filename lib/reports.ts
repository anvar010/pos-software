import { prisma } from "@/lib/db";

export type ReportPeriod = "day" | "week" | "month";

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  label: string; // short display
  revenue: number;
  count: number;
}

export interface ReportData {
  period: ReportPeriod;
  rangeStart: string;
  revenue: number;
  transactions: number;
  avgSale: number;
  trend: TrendPoint[];
  bestSellers: { productId: string; name: string; quantity: number; revenue: number }[];
  salesByUser: { userId: string; name: string; revenue: number; count: number }[];
  stock: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    inventoryRetailValue: number;
    topLow: { id: string; name: string; stock: number; threshold: number }[];
  };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function rangeFor(period: ReportPeriod): { start: Date; days: number } {
  const today = startOfDay(new Date());
  if (period === "day") return { start: today, days: 1 };
  if (period === "month") {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { start, days: 30 };
  }
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  return { start, days: 7 };
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export async function getReport(period: ReportPeriod): Promise<ReportData> {
  const { start, days } = rangeFor(period);
  const saleWhere = {
    createdAt: { gte: start },
    status: { not: "REFUNDED" as const },
  };

  const [sales, grouped, byUser, products] = await Promise.all([
    prisma.sale.findMany({
      where: saleWhere,
      select: { totalAmount: true, createdAt: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: saleWhere },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.sale.groupBy({
      by: ["userId"],
      where: saleWhere,
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, price: true, stockQuantity: true, lowStockThreshold: true },
    }),
  ]);

  // KPIs
  const revenue = sales.reduce((s, x) => s + Number(x.totalAmount), 0);
  const transactions = sales.length;
  const avgSale = transactions ? revenue / transactions : 0;

  // Daily trend buckets
  const buckets = new Map<string, { revenue: number; count: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(dayKey(d), { revenue: 0, count: 0 });
  }
  for (const s of sales) {
    const key = dayKey(new Date(s.createdAt));
    const b = buckets.get(key);
    if (b) {
      b.revenue += Number(s.totalAmount);
      b.count += 1;
    }
  }
  const trend: TrendPoint[] = [...buckets.entries()].map(([date, v]) => {
    const d = new Date(date);
    return {
      date,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      revenue: Math.round(v.revenue * 100) / 100,
      count: v.count,
    };
  });

  // Best sellers
  const bestProductIds = grouped.map((g) => g.productId);
  const bestProducts = await prisma.product.findMany({
    where: { id: { in: bestProductIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(bestProducts.map((p) => [p.id, p.name]));
  const bestSellers = grouped.map((g) => ({
    productId: g.productId,
    name: nameById.get(g.productId) ?? "(deleted)",
    quantity: Number(g._sum.quantity ?? 0),
    revenue: Number(g._sum.subtotal ?? 0),
  }));

  // Sales by user
  const userIds = byUser.map((u) => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userName = new Map(users.map((u) => [u.id, u.name]));
  const salesByUser = byUser
    .map((u) => ({
      userId: u.userId,
      name: userName.get(u.userId) ?? "Unknown",
      revenue: Number(u._sum.totalAmount ?? 0),
      count: u._count._all,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Stock overview (stockQuantity is Decimal -> convert)
  const stockProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    stock: Number(p.stockQuantity),
    threshold: p.lowStockThreshold,
  }));
  const lowStock = stockProducts.filter((p) => p.stock <= p.threshold && p.stock > 0);
  const outOfStock = stockProducts.filter((p) => p.stock <= 0);
  const inventoryRetailValue = stockProducts.reduce(
    (s, p) => s + p.price * p.stock,
    0
  );
  const topLow = [...lowStock, ...outOfStock]
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      threshold: p.threshold,
    }));

  return {
    period,
    rangeStart: start.toISOString(),
    revenue: Math.round(revenue * 100) / 100,
    transactions,
    avgSale: Math.round(avgSale * 100) / 100,
    trend,
    bestSellers,
    salesByUser,
    stock: {
      totalProducts: products.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      inventoryRetailValue: Math.round(inventoryRetailValue * 100) / 100,
      topLow,
    },
  };
}
