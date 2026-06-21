"use client";

import { getDB, type PendingSale } from "@/lib/offline-db";
import type { ProductDTO } from "@/types";

// --- Product cache ---------------------------------------------------------
export async function cacheProducts(products: ProductDTO[]): Promise<void> {
  const db = getDB();
  await db.transaction("rw", db.products, db.meta, async () => {
    await db.products.clear();
    await db.products.bulkPut(products);
    await db.meta.put({ key: "lastProductSync", value: new Date().toISOString() });
  });
}

export async function getCachedProducts(): Promise<ProductDTO[]> {
  return getDB().products.orderBy("name").toArray();
}

export async function hasCachedProducts(): Promise<boolean> {
  return (await getDB().products.count()) > 0;
}

// Optimistically adjust local stock so the cashier sees correct availability
// while offline.
export async function adjustCachedStock(
  deltas: { productId: string; delta: number }[]
): Promise<void> {
  const db = getDB();
  await db.transaction("rw", db.products, async () => {
    for (const { productId, delta } of deltas) {
      const p = await db.products.get(productId);
      if (p) {
        await db.products.update(productId, {
          stockQuantity: p.stockQuantity + delta,
        });
      }
    }
  });
}

// --- Pending sales queue ---------------------------------------------------
export async function enqueueSale(pending: PendingSale): Promise<void> {
  await getDB().pendingSales.put(pending);
}

export async function getPendingSales(): Promise<PendingSale[]> {
  return getDB().pendingSales.orderBy("createdAt").toArray();
}

export async function countPending(): Promise<number> {
  return getDB().pendingSales.where("status").equals("pending").count();
}

export interface SyncResult {
  pushed: number;
  failed: number;
  remaining: number;
}

// Push all pending sales to the server one by one. Network errors keep the sale
// queued; server validation/conflict errors mark it as errored for review.
export async function pushPendingSales(): Promise<SyncResult> {
  const db = getDB();
  const pending = await db.pendingSales
    .filter((s) => s.status === "pending")
    .toArray();

  let pushed = 0;
  let failed = 0;

  for (const sale of pending) {
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sale.payload),
      });

      if (res.ok) {
        await db.pendingSales.delete(sale.localId);
        pushed++;
      } else if (res.status >= 400 && res.status < 500 && res.status !== 408) {
        // Permanent error (validation/conflict) — flag for review, stop retrying.
        const data = await res.json().catch(() => ({}));
        await db.pendingSales.update(sale.localId, {
          status: "error",
          error: data.error ?? `Server rejected (${res.status})`,
        });
        failed++;
      } else {
        // Transient server error — leave queued for the next attempt.
        break;
      }
    } catch {
      // Network failure — still offline; stop and retry later.
      break;
    }
  }

  const remaining = await countPending();
  return { pushed, failed, remaining };
}

// Pull fresh product/inventory data into the local cache.
export async function pullProducts(): Promise<boolean> {
  try {
    const res = await fetch("/api/products");
    if (!res.ok) return false;
    const products: ProductDTO[] = await res.json();
    await cacheProducts(products);
    return true;
  } catch {
    return false;
  }
}

// Full sync: push queued sales first, then refresh the product cache.
export async function syncAll(): Promise<SyncResult> {
  const result = await pushPendingSales();
  await pullProducts();
  return result;
}
