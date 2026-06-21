"use client";

import { useMemo, useState } from "react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ProductForm } from "@/components/inventory/ProductForm";
import { StockModal } from "@/components/inventory/StockModal";
import { CsvImport } from "@/components/inventory/CsvImport";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/format";
import type { CategoryDTO, ProductDTO } from "@/types";

export function InventoryClient({
  initialProducts,
  categories,
  currency,
}: {
  initialProducts: ProductDTO[];
  categories: CategoryDTO[];
  currency: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ProductDTO | null>(null);
  const [stockFor, setStockFor] = useState<ProductDTO | null>(null);
  const [deleting, setDeleting] = useState<ProductDTO | null>(null);
  const [importing, setImporting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/products");
    if (res.ok) setProducts(await res.json());
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryId && p.categoryId !== categoryId) return false;
      if (lowStockOnly && p.stockQuantity > p.lowStockThreshold) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, categoryId, lowStockOnly]);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stockQuantity <= p.lowStockThreshold).length,
    [products]
  );

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    const res = await fetch(`/api/products/${deleting.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Could not delete.");
      return;
    }
    setDeleting(null);
    await refresh();
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setAdding(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm active:scale-95"
        >
          ＋ Add product
        </button>
        <button
          onClick={() => setImporting(true)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
        >
          ⬆ Import CSV
        </button>
        {lowStockCount > 0 && (
          <button
            onClick={() => setLowStockOnly((v) => !v)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              lowStockOnly
                ? "bg-amber-500 text-white"
                : "border border-amber-300 bg-amber-50 text-amber-700"
            }`}
          >
            ⚠ {lowStockCount} low stock
          </button>
        )}
        <span className="ml-auto text-sm text-slate-500">
          {filtered.length} of {products.length}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-1 min-w-[200px] gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU, barcode…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            onClick={() => setScanning(true)}
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-sm hover:bg-slate-100"
            title="Scan barcode to search"
          >
            📷
          </button>
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-base"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
          No products found.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => {
            const low = p.stockQuantity <= p.lowStockThreshold;
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl || "/icons/icon-192.png"}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "/icons/icon-192.png";
                  }}
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {p.sku}
                    {p.barcode ? ` · ${p.barcode}` : ""}
                    {p.category ? ` · ${p.category.name}` : ""}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-semibold">{formatCurrency(p.price, currency)}</p>
                  <p className="text-xs text-slate-400">
                    cost {formatCurrency(p.costPrice, currency)}
                  </p>
                </div>
                <div className="w-20 text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-sm font-semibold ${
                      low ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {p.stockQuantity}
                  </span>
                  {low && <p className="text-[10px] font-medium text-amber-600">LOW</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setStockFor(p)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                    title="Adjust stock"
                  >
                    📦
                  </button>
                  <button
                    onClick={() => setEditing(p)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      setDeleteError(null);
                      setDeleting(p);
                    }}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-red-50"
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modals */}
      {adding && (
        <ProductForm
          categories={categories}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}
      {editing && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
      {stockFor && (
        <StockModal
          product={stockFor}
          onClose={() => setStockFor(null)}
          onSaved={() => {
            setStockFor(null);
            refresh();
          }}
        />
      )}
      {importing && (
        <CsvImport onClose={() => setImporting(false)} onImported={refresh} />
      )}
      {scanning && (
        <BarcodeScanner
          onScan={(code) => {
            setSearch(code);
            setScanning(false);
          }}
          onClose={() => setScanning(false)}
        />
      )}
      {deleting && (
        <Modal title="Delete product" onClose={() => setDeleting(null)} size="sm">
          <p className="text-sm text-slate-600">
            Delete <strong>{deleting.name}</strong>? This cannot be undone.
          </p>
          {deleteError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {deleteError}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={() => setDeleting(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white active:scale-95"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
