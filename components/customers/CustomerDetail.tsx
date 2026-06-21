"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/format";
import type { CustomerDetailDTO } from "@/types";

export function CustomerDetail({
  customerId,
  currency,
  onClose,
}: {
  customerId: string;
  currency: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<CustomerDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/customers/${customerId}`);
      if (active && res.ok) setData(await res.json());
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [customerId]);

  return (
    <Modal title={data?.name ?? "Customer"} onClose={onClose} size="lg">
      {loading ? (
        <p className="py-8 text-center text-slate-400">Loading…</p>
      ) : !data ? (
        <p className="py-8 text-center text-red-600">Could not load customer.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Loyalty pts" value={String(data.loyaltyPoints)} accent />
            <Stat label="Purchases" value={String(data.saleCount)} />
            <Stat label="Total spent" value={formatCurrency(data.totalSpent, currency)} />
          </div>

          <div className="text-sm text-slate-500">
            {data.phone && <p>📞 {data.phone}</p>}
            {data.email && <p>✉️ {data.email}</p>}
            <p>Joined {new Date(data.createdAt).toLocaleDateString()}</p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Purchase history</h3>
            {data.sales.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No purchases yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.sales.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">
                        {new Date(s.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400">
                        {s.items.reduce((n, i) => n + i.quantity, 0)} item(s) ·{" "}
                        {s.paymentMethod.toLowerCase()}
                        {s.status !== "COMPLETED" && (
                          <span className="ml-1 text-amber-600">· {s.status}</span>
                        )}
                      </p>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(s.totalAmount, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? "bg-indigo-50" : "bg-slate-50"}`}>
      <p className={`text-xl font-bold ${accent ? "text-indigo-700" : "text-slate-800"}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
