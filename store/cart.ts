"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductDTO } from "@/types";

export interface CartLine {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number; // price per 1 base unit (per pc / kg / ltr / gram)
  taxRate: number;
  unit: string;
  baseQty: number; // grams the price applies to (g items); else 1
  imageUrl: string | null;
  quantity: number; // in base unit (pcs / kg / ltr / grams)
  lineDiscount: number;
  /** cached available stock for UI hints */
  stockQuantity: number;
}

export interface CartCustomer {
  id: string;
  name: string;
}

interface CartState {
  lines: CartLine[];
  cartDiscount: number;
  customer: CartCustomer | null;
  addProduct: (p: ProductDTO, qty?: number) => void;
  setQuantity: (productId: string, qty: number) => void;
  increment: (productId: string, delta: number) => void;
  setLineDiscount: (productId: string, amount: number) => void;
  removeLine: (productId: string) => void;
  setCartDiscount: (amount: number) => void;
  setCustomer: (c: CartCustomer | null) => void;
  clear: () => void;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      cartDiscount: 0,
      customer: null,

      addProduct: (p) =>
        set((state) => {
          const isG = p.unit === "g";
          const base = p.baseQty || 1;
          // price per 1 base unit; for grams that's price / baseQty per gram
          const unitPrice = isG ? p.price / base : p.price;
          // amount added per tap: 1 pc / 1 kg / 1 ltr / `base` grams
          const addQty = isG ? base : 1;

          const existing = state.lines.find((l) => l.productId === p.id);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === p.id ? { ...l, quantity: l.quantity + addQty } : l
              ),
            };
          }
          const line: CartLine = {
            productId: p.id,
            name: p.name,
            sku: p.sku,
            unitPrice,
            taxRate: p.taxRate,
            unit: p.unit,
            baseQty: base,
            imageUrl: p.imageUrl,
            quantity: addQty,
            lineDiscount: 0,
            stockQuantity: p.stockQuantity,
          };
          return { lines: [...state.lines, line] };
        }),

      setQuantity: (productId, qty) =>
        set((state) => ({
          // Clamp at 0 but keep the line (remove via the ✕ button) so a cashier
          // can type fractional weights like "0.250" without it vanishing.
          lines: state.lines.map((l) =>
            l.productId === productId ? { ...l, quantity: Math.max(0, qty) } : l
          ),
        })),

      increment: (productId, delta) =>
        set((state) => ({
          lines: state.lines
            .map((l) =>
              l.productId === productId
                ? { ...l, quantity: l.quantity + delta }
                : l
            )
            .filter((l) => l.quantity > 0),
        })),

      setLineDiscount: (productId, amount) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.productId === productId ? { ...l, lineDiscount: Math.max(0, amount) } : l
          ),
        })),

      removeLine: (productId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.productId !== productId),
        })),

      setCartDiscount: (amount) => set({ cartDiscount: Math.max(0, amount) }),
      setCustomer: (customer) => set({ customer }),
      clear: () => set({ lines: [], cartDiscount: 0, customer: null }),
      count: () => get().lines.reduce((s, l) => s + l.quantity, 0),
    }),
    { name: "pos-cart" }
  )
);
