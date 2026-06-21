"use client";

import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/format";
import type { SaleDTO, StoreDTO } from "@/types";

const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  DIGITAL_WALLET: "Google Pay",
  SPLIT: "Split",
};

function receiptText(sale: SaleDTO, store: StoreDTO): string {
  const lines = [
    store.name,
    new Date(sale.createdAt).toLocaleString(),
    "",
    ...sale.items.map(
      (i) => `${i.quantity} x ${i.productName}  ${formatCurrency(i.subtotal, store.currency)}`
    ),
    "",
    `Total: ${formatCurrency(sale.totalAmount, store.currency)}`,
    store.receiptFooter ?? "",
  ];
  return lines.filter(Boolean).join("\n");
}

export function Receipt({
  sale,
  store,
  queued,
  onClose,
  onNewSale,
}: {
  sale: SaleDTO;
  store: StoreDTO;
  queued?: boolean;
  onClose: () => void;
  onNewSale: () => void;
}) {
  const text = receiptText(sale, store);
  const encoded = encodeURIComponent(text);

  return (
    <Modal title="Receipt" onClose={onClose} size="sm">
      <div className="receipt-print mx-auto max-w-xs font-mono text-sm text-slate-900">
        <div className="text-center">
          <p className="text-base font-bold">{store.name}</p>
          {store.address && <p className="text-xs">{store.address}</p>}
          {store.phone && <p className="text-xs">{store.phone}</p>}
        </div>

        <div className="my-2 border-t border-dashed border-slate-400" />

        <p className="text-xs">
          {new Date(sale.createdAt).toLocaleString()}
        </p>
        <p className="text-xs">Receipt: {sale.id.slice(-10)}</p>
        {sale.customerName && <p className="text-xs">Customer: {sale.customerName}</p>}
        {sale.userName && <p className="text-xs">Cashier: {sale.userName}</p>}

        <div className="my-2 border-t border-dashed border-slate-400" />

        <table className="w-full">
          <tbody>
            {sale.items.map((i) => (
              <tr key={i.id}>
                <td className="align-top">
                  {i.quantity} × {i.productName}
                  {i.discountAmount > 0 && (
                    <span className="block text-[10px] text-slate-500">
                      −{formatCurrency(i.discountAmount, store.currency)} disc
                    </span>
                  )}
                </td>
                <td className="text-right align-top">
                  {formatCurrency(i.subtotal, store.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="my-2 border-t border-dashed border-slate-400" />

        <div className="space-y-0.5">
          {sale.discountAmount > 0 && (
            <Row label="Discount" value={`−${formatCurrency(sale.discountAmount, store.currency)}`} />
          )}
          <Row label="Tax" value={formatCurrency(sale.taxAmount, store.currency)} />
          <Row
            label="TOTAL"
            value={formatCurrency(sale.totalAmount, store.currency)}
            bold
          />
          <Row label="Payment" value={METHOD_LABEL[sale.paymentMethod] ?? sale.paymentMethod} />
          {sale.payments?.map((p, idx) => (
            <Row
              key={idx}
              label={`  ${METHOD_LABEL[p.method]}`}
              value={formatCurrency(p.amount, store.currency)}
            />
          ))}
        </div>

        <div className="my-2 border-t border-dashed border-slate-400" />
        <p className="text-center text-xs">{store.receiptFooter}</p>
        {queued && (
          <p className="mt-2 text-center text-[10px] text-amber-600">
            (Saved offline — will sync when back online)
          </p>
        )}
      </div>

      {/* Actions (not printed) */}
      <div className="no-print mt-5 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white active:scale-95"
          >
            🖨 Print
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white active:scale-95"
          >
            ＋ New sale
          </button>
        </div>
        <div className="flex gap-2 text-center text-sm">
          <a
            href={`https://wa.me/?text=${encoded}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-medium hover:bg-slate-100"
          >
            WhatsApp
          </a>
          <a
            href={`sms:?body=${encoded}`}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-medium hover:bg-slate-100"
          >
            SMS
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent("Your receipt")}&body=${encoded}`}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-medium hover:bg-slate-100"
          >
            Email
          </a>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : "text-xs"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
