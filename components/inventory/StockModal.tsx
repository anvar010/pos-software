"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { ProductDTO } from "@/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export function StockModal({
  product,
  onClose,
  onSaved,
}: {
  product: ProductDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("1");
  const [reason, setReason] = useState<"RESTOCK" | "ADJUSTMENT" | "RETURN">("RESTOCK");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const qty = parseInt(amount || "0", 10);
  const change = direction === "in" ? qty : -qty;
  const newStock = product.stockQuantity + change;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!qty) {
      setError("Enter an amount.");
      return;
    }
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/products/${product.id}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changeAmount: change, reason, note }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not adjust stock.");
      return;
    }
    onSaved();
  }

  return (
    <Modal title={`Adjust stock · ${product.name}`} onClose={onClose} size="sm">
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">
          Current stock: <span className="font-semibold text-slate-800">{product.stockQuantity}</span>
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setDirection("in");
              setReason("RESTOCK");
            }}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              direction === "in"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-300"
            }`}
          >
            ＋ Add stock
          </button>
          <button
            type="button"
            onClick={() => {
              setDirection("out");
              setReason("ADJUSTMENT");
            }}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              direction === "out"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-300"
            }`}
          >
            － Remove stock
          </button>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Amount
          <input
            className={inputClass}
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Reason
          <select
            className={inputClass}
            value={reason}
            onChange={(e) => setReason(e.target.value as typeof reason)}
          >
            <option value="RESTOCK">Restock</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="RETURN">Return</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Note (optional)
          <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <p className="text-sm text-slate-600">
          New stock will be{" "}
          <span className={`font-semibold ${newStock < 0 ? "text-red-600" : "text-slate-900"}`}>
            {newStock}
          </span>
        </p>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
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
            {saving ? "Saving…" : "Apply"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
