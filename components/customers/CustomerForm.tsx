"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { CustomerDTO } from "@/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export function CustomerForm({
  customer,
  onClose,
  onSaved,
}: {
  customer?: CustomerDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!customer;
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(
      isEdit ? `/api/customers/${customer.id}` : "/api/customers",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      }
    );
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save customer.");
      return;
    }
    onSaved();
  }

  return (
    <Modal title={isEdit ? "Edit customer" : "Add customer"} onClose={onClose} size="sm">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Name
          <input className={inputClass} required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Phone
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white active:scale-95 disabled:opacity-60">
            {saving ? "Saving…" : isEdit ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
