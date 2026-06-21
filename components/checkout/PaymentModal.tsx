"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/format";
import type { PaymentSplit } from "@/types";

type Method = "CASH" | "CARD" | "DIGITAL_WALLET" | "SPLIT";

const METHODS: { key: Method; label: string; icon: string }[] = [
  { key: "CASH", label: "Cash", icon: "💵" },
  { key: "DIGITAL_WALLET", label: "Google Pay", icon: "📱" },
];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export function PaymentModal({
  total,
  currency,
  submitting,
  onConfirm,
  onClose,
}: {
  total: number;
  currency: string;
  submitting: boolean;
  onConfirm: (method: Method, payments?: PaymentSplit[]) => void;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<Method>("CASH");
  const [tendered, setTendered] = useState("");

  const tenderedNum = parseFloat(tendered || "0") || 0;
  const change = tenderedNum - total;

  return (
    <Modal title="Payment" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="rounded-xl bg-indigo-50 p-4 text-center">
          <p className="text-sm text-indigo-700">Amount due</p>
          <p className="text-3xl font-bold text-indigo-900">
            {formatCurrency(total, currency)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {METHODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-sm font-medium ${
                method === m.key
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-300"
              }`}
            >
              <span className="text-xl">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {method === "CASH" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Cash tendered
              <input
                className={`mt-1 ${inputClass}`}
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
                placeholder={total.toFixed(2)}
              />
            </label>
            {tenderedNum > 0 && (
              <p className={`text-sm ${change >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                Change: {formatCurrency(Math.max(0, change), currency)}
                {change < 0 && ` (short ${formatCurrency(-change, currency)})`}
              </p>
            )}
          </div>
        )}

        <button
          onClick={() => onConfirm(method)}
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm active:scale-95 disabled:opacity-50"
        >
          {submitting ? "Processing…" : `Charge ${formatCurrency(total, currency)}`}
        </button>
      </div>
    </Modal>
  );
}
