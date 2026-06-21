"use client";

import { useState } from "react";
import type { CategoryDTO, StoreDTO } from "@/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export function SettingsClient({
  store,
  categories: initialCategories,
}: {
  store: StoreDTO;
  categories: CategoryDTO[];
}) {
  const [form, setForm] = useState({
    name: store.name,
    address: store.address ?? "",
    phone: store.phone ?? "",
    email: store.email ?? "",
    logoUrl: store.logoUrl ?? "",
    currency: store.currency,
    defaultTaxRate: String(store.defaultTaxRate),
    loyaltyRate: String(store.loyaltyRate),
    lowStockDefault: String(store.lowStockDefault),
    receiptFooter: store.receiptFooter ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState(initialCategories);
  const [newCategory, setNewCategory] = useState("");

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function saveStore(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save settings.");
      return;
    }
    setSaved(true);
  }

  async function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const created: CategoryDTO = await res.json();
      setCategories((c) => [...c, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory("");
    }
  }

  async function deleteCategory(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) setCategories((c) => c.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Store info + receipt */}
      <form onSubmit={saveStore} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Store details</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Store name" className="sm:col-span-2">
            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Logo URL" className="sm:col-span-2">
            <input className={inputClass} value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://…" />
          </Field>
        </div>

        <h2 className="mt-6 text-lg font-semibold">Defaults</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Currency">
            <input className={inputClass} value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} maxLength={8} />
          </Field>
          <Field label="Tax rate %">
            <input className={inputClass} type="number" step="0.01" min="0" max="100" value={form.defaultTaxRate} onChange={(e) => set("defaultTaxRate", e.target.value)} />
          </Field>
          <Field label="Loyalty / unit">
            <input className={inputClass} type="number" step="0.01" min="0" value={form.loyaltyRate} onChange={(e) => set("loyaltyRate", e.target.value)} />
          </Field>
          <Field label="Low-stock default">
            <input className={inputClass} type="number" step="1" min="0" value={form.lowStockDefault} onChange={(e) => set("lowStockDefault", e.target.value)} />
          </Field>
        </div>

        <h2 className="mt-6 text-lg font-semibold">Receipt</h2>
        <Field label="Footer message" className="mt-4">
          <textarea
            className={inputClass}
            rows={2}
            value={form.receiptFooter}
            onChange={(e) => set("receiptFooter", e.target.value)}
            placeholder="Thank you for shopping with us!"
          />
        </Field>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white active:scale-95 disabled:opacity-60">
            {saving ? "Saving…" : "Save settings"}
          </button>
          {saved && <span className="text-sm font-medium text-emerald-600">✓ Saved</span>}
        </div>
      </form>

      {/* Categories */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Categories</h2>
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-base"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
            placeholder="New category name"
          />
          <button onClick={addCategory} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white active:scale-95">
            Add
          </button>
        </div>
        {categories.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm">
                {c.name}
                <button onClick={() => deleteCategory(c.id)} className="text-slate-400 hover:text-red-600" title="Delete">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label}
      {children}
    </label>
  );
}
