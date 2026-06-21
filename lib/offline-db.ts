"use client";

import Dexie, { type Table } from "dexie";
import type { ProductDTO, SaleDTO } from "@/types";
import type { SaleInput } from "@/lib/validations";

// A sale captured locally and waiting to be pushed to the server.
export interface PendingSale {
  localId: string; // primary key
  payload: SaleInput & { localId: string };
  receipt: SaleDTO; // optimistic receipt shown to the cashier
  status: "pending" | "error";
  error?: string;
  createdAt: string;
}

export interface MetaRow {
  key: string;
  value: string;
}

class POSDatabase extends Dexie {
  products!: Table<ProductDTO, string>;
  pendingSales!: Table<PendingSale, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("pos-offline");
    this.version(1).stores({
      products: "id, sku, barcode, name",
      pendingSales: "localId, status, createdAt",
      meta: "key",
    });
  }
}

// Lazily instantiate so this module is import-safe on the server.
let _db: POSDatabase | null = null;
export function getDB(): POSDatabase {
  if (typeof window === "undefined") {
    throw new Error("offline-db is only available in the browser");
  }
  if (!_db) _db = new POSDatabase();
  return _db;
}
