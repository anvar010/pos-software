"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/format";
import type { PaymentSplit } from "@/types";

type Method = "CASH" | "CARD" | "DIGITAL_WALLET" | "SPLIT";

const METHODS: { key: Method; label: string; icon: string }[] = [
  { key: "CASH", label: "Cash", icon: "💵" },
  { key: "CARD", label: "Card", icon: "💳" },
  { key: "DIGITAL_WALLET", label: "Wallet", icon: "📱" },
  { key: "SPLIT", label: "Split", icon: "🪙" },
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
  const [split, setSplit] = useState({ CASH: "", CARD: "", DIGITAL_WALLET: "" });

  const tenderedNum = parseFloat(tendered || "0") || 0;
  const change = tenderedNum - total;

  const splitTotal =
    (parseFloat(split.CASH || "0") || 0) +
    (parseFloat(split.CARD || "0") || 0) +
    (parseFloat(split.DIGITAL_WALLET || "0") || 0);
  const splitRemaining = total - splitTotal;

  function confirm() {
    if (method === "SPLIT") {
      const payments: PaymentSplit[] = (
        ["CASH", "CARD", "DIGITAL_WALLET"] as const
      )
        .map((m) => ({ method: m, amount: parseFloat(split[m] || "0") || 0 }))
        .filter((p) => p.amount > 0);
      onConfirm("SPLIT", payments);
    } else {
      onConfirm(method);
    }
  }

  const canConfirm =
    !submitting &&
    (method !== "SPLIT" ? true : splitTotal >= total - 0.001);

  return (
    <Modal title="Payment" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="rounded-xl bg-indigo-50 p-4 text-center">
          <p className="text-sm text-indigo-700">Amount due</p>
          <p className="text-3xl font-bold text-indigo-900">
            {formatCurrency(total, currency)}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {METHODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs font-medium ${
                method === m.key
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-300"
              }`}
            >
              <span className="text-lg">{m.icon}</span>
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

        {method === "SPLIT" && (
          <div className="space-y-2">
            {(["CASH", "CARD", "DIGITAL_WALLET"] as const).map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm">
                <span className="w-20 text-slate-600">
                  {m === "DIGITAL_WALLET" ? "Wallet" : m[0] + m.slice(1).toLowerCase()}
                </span>
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={split[m]}
                  onChange={(e) => setSplit((s) => ({ ...s, [m]: e.target.value }))}
                />
              </label>
            ))}
            <p
              className={`text-sm ${
                splitRemaining <= 0.001 ? "text-emerald-700" : "text-amber-600"
              }`}
            >
              {splitRemaining > 0.001
                ? `Remaining: ${formatCurrency(splitRemaining, currency)}`
                : splitRemaining < -0.001
                ? `Change: ${formatCurrency(-splitRemaining, currency)}`
                : "Fully covered"}
            </p>
          </div>
        )}

        <button
          onClick={confirm}
          disabled={!canConfirm}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm active:scale-95 disabled:opacity-50"
        >
          {submitting ? "Processing…" : `Charge ${formatCurrency(total, currency)}`}
        </button>
      </div>
    </Modal>
  );
}
