"use client";

import { useMemo, useState } from "react";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { CustomerDetail } from "@/components/customers/CustomerDetail";
import { Modal } from "@/components/ui/Modal";
import type { CustomerDTO } from "@/types";

export function CustomersClient({
  initialCustomers,
  currency,
}: {
  initialCustomers: CustomerDTO[];
  currency: string;
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CustomerDTO | null>(null);
  const [viewing, setViewing] = useState<CustomerDTO | null>(null);
  const [deleting, setDeleting] = useState<CustomerDTO | null>(null);

  async function refresh() {
    const res = await fetch("/api/customers");
    if (res.ok) setCustomers(await res.json());
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  async function confirmDelete() {
    if (!deleting) return;
    await fetch(`/api/customers/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setAdding(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white active:scale-95"
        >
          ＋ Add customer
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, email…"
          className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
          No customers yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <button onClick={() => setViewing(c)} className="min-w-0 flex-1 text-left">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {[c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                </p>
              </button>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-sm font-semibold text-indigo-700">
                {c.loyaltyPoints} pts
              </span>
              <button
                onClick={() => setEditing(c)}
                className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
              >
                ✏️
              </button>
              <button
                onClick={() => setDeleting(c)}
                className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-red-50"
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <CustomerForm
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}
      {editing && (
        <CustomerForm
          customer={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
      {viewing && (
        <CustomerDetail
          customerId={viewing.id}
          currency={currency}
          onClose={() => setViewing(null)}
        />
      )}
      {deleting && (
        <Modal title="Delete customer" onClose={() => setDeleting(null)} size="sm">
          <p className="text-sm text-slate-600">
            Delete <strong>{deleting.name}</strong>? Their past sales are kept but
            unlinked.
          </p>
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
