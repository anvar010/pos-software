import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { withDbRetry } from "@/lib/db-retry";
import { saleInputSchema } from "@/lib/validations";
import { serializeSale } from "@/lib/serialize";
import { computeSaleTotals, loyaltyPointsFor, type SaleLineInput } from "@/lib/sale-calc";

const saleInclude = {
  items: { include: { product: true } },
  customer: true,
  user: true,
} satisfies Prisma.SaleInclude;

// GET /api/sales?from=&to=&customerId=&limit=
export async function GET(req: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const customerId = searchParams.get("customerId");
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);

  const where: Prisma.SaleWhereInput = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (customerId) where.customerId = customerId;

  const sales = await prisma.sale.findMany({
    where,
    include: saleInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json(sales.map(serializeSale));
}

// POST /api/sales — create a sale (also used by the offline sync engine).
export async function POST(req: NextRequest) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = saleInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const input = parsed.data;

  // Idempotency: if this offline sale was already synced, return the existing one.
  if (input.localId) {
    const existing = await prisma.sale.findUnique({
      where: { localId: input.localId },
      include: saleInclude,
    });
    if (existing) {
      return NextResponse.json(serializeSale(existing), { status: 200 });
    }
  }

  // Load the referenced products (server is authoritative for tax + stock).
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const missing = productIds.filter((id) => !productMap.has(id));
  if (missing.length) {
    return NextResponse.json(
      { error: "Some products no longer exist.", missing },
      { status: 422 }
    );
  }

  // Build calc lines (unitPrice from client = price captured at sale time).
  const lines: SaleLineInput[] = input.items.map((i) => {
    const p = productMap.get(i.productId)!;
    return {
      productId: i.productId,
      name: p.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      taxRate: Number(p.taxRate),
      lineDiscount: i.lineDiscount,
    };
  });
  const totals = computeSaleTotals(lines, input.cartDiscount);

  // Stock check. Online sales are blocked on insufficient stock; offline-origin
  // sales are allowed through but flagged for manager review.
  const insufficient = input.items
    .map((i) => {
      const p = productMap.get(i.productId)!;
      return { productId: i.productId, name: p.name, available: p.stockQuantity, requested: i.quantity };
    })
    .filter((x) => x.requested > x.available);

  if (insufficient.length && !input.isOffline) {
    return NextResponse.json(
      { error: "Insufficient stock.", insufficient },
      { status: 409 }
    );
  }

  const status = insufficient.length && input.isOffline ? "PENDING_REVIEW" : "COMPLETED";
  const createdAt = input.createdAt ? new Date(input.createdAt) : undefined;

  // Load store for loyalty rate.
  const store = await prisma.store.findUnique({ where: { id: "store" } });
  const loyaltyRate = store ? Number(store.loyaltyRate) : 1;

  try {
    const sale = await withDbRetry(() =>
      prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          localId: input.localId ?? null,
          customerId: input.customerId ?? null,
          userId: session.user.id,
          totalAmount: totals.total,
          discountAmount: totals.totalDiscount,
          taxAmount: totals.taxAmount,
          paymentMethod: input.paymentMethod,
          payments: input.payments ? (input.payments as Prisma.InputJsonValue) : Prisma.JsonNull,
          status,
          isSyncedFromOffline: input.isOffline,
          ...(createdAt ? { createdAt } : {}),
          items: {
            create: totals.lines.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              discountAmount: l.lineDiscount,
              subtotal: l.subtotal,
            })),
          },
        },
        include: saleInclude,
      });

      // Deduct stock + audit log.
      for (const item of input.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            changeAmount: -item.quantity,
            reason: input.isOffline ? "OFFLINE_SYNC" : "SALE",
            note: `Sale ${created.id}`,
            userId: session.user.id,
          },
        });
      }

      // Loyalty points.
      if (input.customerId) {
        const points = loyaltyPointsFor(totals.total, loyaltyRate);
        if (points > 0) {
          await tx.customer.update({
            where: { id: input.customerId },
            data: { loyaltyPoints: { increment: points } },
          });
        }
      }

      return created;
      })
    );

    return NextResponse.json(serializeSale(sale), { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // localId raced — fetch and return the winner.
      if (input.localId) {
        const existing = await prisma.sale.findUnique({
          where: { localId: input.localId },
          include: saleInclude,
        });
        if (existing) return NextResponse.json(serializeSale(existing), { status: 200 });
      }
    }
    throw e;
  }
}
