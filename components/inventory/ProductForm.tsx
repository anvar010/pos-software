"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import type { CategoryDTO, ProductDTO } from "@/types";

type FormState = {
  name: string;
  sku: string;
  barcode: string;
  price: string;
  costPrice: string;
  categoryId: string;
  stockQuantity: string;
  lowStockThreshold: string;
  imageUrl: string;
  taxRate: string;
};

function initialState(product?: ProductDTO): FormState {
  return {
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    price: product ? String(product.price) : "",
    costPrice: product ? String(product.costPrice) : "0",
    categoryId: product?.categoryId ?? "",
    stockQuantity: product ? String(product.stockQuantity) : "0",
    lowStockThreshold: product ? String(product.lowStockThreshold) : "5",
    imageUrl: product?.imageUrl ?? "",
    taxRate: product ? String(product.taxRate) : "0",
  };
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product?: ProductDTO;
  categories: CategoryDTO[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initialState(product));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const isEdit = !!product;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      sku: form.sku,
      barcode: form.barcode || null,
      price: form.price,
      costPrice: form.costPrice || 0,
      categoryId: form.categoryId || null,
      stockQuantity: form.stockQuantity || 0,
      lowStockThreshold: form.lowStockThreshold || 0,
      imageUrl: form.imageUrl || null,
      taxRate: form.taxRate || 0,
    };

    const res = await fetch(
      isEdit ? `/api/products/${product.id}` : "/api/products",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save product.");
      return;
    }
    onSaved();
  }

  return (
    <>
      <Modal title={isEdit ? "Edit product" : "Add product"} onClose={onClose} size="lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Name
              <input
                className={inputClass}
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              SKU
              <input
                className={inputClass}
                required
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Barcode
              <div className="mt-1 flex gap-2">
                <input
                  className={inputClass.replace("mt-1 ", "")}
                  value={form.barcode}
                  onChange={(e) => set("barcode", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setScanning(true)}
                  className="shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-medium hover:bg-slate-100"
                  title="Scan with camera"
                >
                  📷
                </button>
              </div>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Price
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Cost price
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                value={form.costPrice}
                onChange={(e) => set("costPrice", e.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Category
              <select
                className={inputClass}
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Tax rate (%)
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.taxRate}
                onChange={(e) => set("taxRate", e.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Stock quantity
              <input
                className={inputClass}
                type="number"
                step="1"
                value={form.stockQuantity}
                onChange={(e) => set("stockQuantity", e.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Low-stock threshold
              <input
                className={inputClass}
                type="number"
                step="1"
                min="0"
                value={form.lowStockThreshold}
                onChange={(e) => set("lowStockThreshold", e.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Image URL
              <input
                className={inputClass}
                placeholder="https://…"
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
              />
            </label>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm active:scale-95 disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
            </button>
          </div>
        </form>
      </Modal>

      {scanning && (
        <BarcodeScanner
          onScan={(code) => {
            set("barcode", code);
            setScanning(false);
          }}
          onClose={() => setScanning(false)}
        />
      )}
    </>
  );
}
