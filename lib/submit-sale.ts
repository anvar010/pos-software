"use client";

import { computeSaleTotals, type SaleLineInput } from "@/lib/sale-calc";
import { adjustCachedStock, enqueueSale } from "@/lib/offline-sync";
import type { CartCustomer, CartLine } from "@/store/cart";
import type { PaymentSplit, SaleDTO } from "@/types";
import type { SaleInput } from "@/lib/validations";

export interface SubmitSaleArgs {
  lines: CartLine[];
  cartDiscount: number;
  customer: CartCustomer | null;
  paymentMethod: "CASH" | "CARD" | "DIGITAL_WALLET" | "SPLIT";
  payments?: PaymentSplit[];
  online: boolean;
  cashierName?: string | null;
}

export type SubmitSaleResult =
  | { ok: true; queued: boolean; sale: SaleDTO }
  | { ok: false; error: string; insufficient?: { name: string; available: number; requested: number }[] };

function newLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `loc_${crypto.randomUUID()}`;
  }
  return `loc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export async function submitSale(args: SubmitSaleArgs): Promise<SubmitSaleResult> {
  const { lines, cartDiscount, customer, paymentMethod, payments, online } = args;

  const calcLines: SaleLineInput[] = lines.map((l) => ({
    productId: l.productId,
    name: l.name,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRate: l.taxRate,
    lineDiscount: l.lineDiscount,
  }));
  const totals = computeSaleTotals(calcLines, cartDiscount);

  const localId = newLocalId();
  const createdAt = new Date().toISOString();

  const payload: SaleInput & { localId: string } = {
    localId,
    customerId: customer?.id ?? null,
    items: lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineDiscount: l.lineDiscount,
    })),
    cartDiscount,
    paymentMethod,
    payments,
    isOffline: false,
    createdAt,
  };

  // Build the receipt we'd show optimistically (also stored with the queued sale).
  const optimisticReceipt: SaleDTO = {
    id: localId,
    localId,
    customerId: customer?.id ?? null,
    customerName: customer?.name ?? null,
    userId: "",
    userName: args.cashierName ?? null,
    totalAmount: totals.total,
    discountAmount: totals.totalDiscount,
    taxAmount: totals.taxAmount,
    paymentMethod,
    payments: payments ?? null,
    status: "COMPLETED",
    isSyncedFromOffline: true,
    createdAt,
    items: totals.lines.map((l) => ({
      id: l.productId,
      productId: l.productId,
      productName: l.name,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discountAmount: l.lineDiscount,
      subtotal: l.subtotal,
    })),
  };

  // Try the server first when we believe we're online.
  if (online) {
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const sale: SaleDTO = await res.json();
        return { ok: true, queued: false, sale };
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.insufficient) {
        return { ok: false, error: data.error ?? "Insufficient stock.", insufficient: data.insufficient };
      }
      return { ok: false, error: data.error ?? `Could not complete sale (${res.status}).` };
    } catch {
      // Network dropped mid-request — fall through to offline queue.
    }
  }

  // Offline path: queue the sale and decrement the local cache.
  await enqueueSale({
    localId,
    payload: { ...payload, isOffline: true },
    receipt: optimisticReceipt,
    status: "pending",
    createdAt,
  });
  await adjustCachedStock(
    lines.map((l) => ({ productId: l.productId, delta: -l.quantity }))
  );

  return { ok: true, queued: true, sale: optimisticReceipt };
}
