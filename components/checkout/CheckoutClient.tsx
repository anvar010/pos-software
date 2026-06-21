"use client";

import { useEffect, useMemo, useState } from "react";
import { PaymentModal } from "@/components/checkout/PaymentModal";
import { Receipt } from "@/components/Receipt";
import { Modal } from "@/components/ui/Modal";
import { useCart } from "@/store/cart";
import { useOnline } from "@/lib/use-online";
import { computeSaleTotals, type SaleLineInput } from "@/lib/sale-calc";
import { submitSale } from "@/lib/submit-sale";
import { cacheProducts, getCachedProducts } from "@/lib/offline-sync";
import { formatCurrency } from "@/lib/format";
import type {
  CategoryDTO,
  PaymentSplit,
  ProductDTO,
  SaleDTO,
  StoreDTO,
} from "@/types";

interface CustomerLite {
  id: string;
  name: string;
  phone: string | null;
}

const FALLBACK_IMG = "/icons/icon-192.png";

export function CheckoutClient({
  initialProducts,
  categories,
  store,
  customers,
  cashierName,
}: {
  initialProducts: ProductDTO[];
  categories: CategoryDTO[];
  store: StoreDTO;
  customers: CustomerLite[];
  cashierName: string | null;
}) {
  const online = useOnline();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<ProductDTO[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>(""); // "" = All
  const [paying, setPaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ sale: SaleDTO; queued: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickingCustomer, setPickingCustomer] = useState(false);

  const cart = useCart();

  useEffect(() => setMounted(true), []);

  async function loadProducts() {
    if (navigator.onLine) {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const fresh: ProductDTO[] = await res.json();
          setProducts(fresh);
          await cacheProducts(fresh);
          return;
        }
      } catch {
        /* fall through to cache */
      }
    }
    const cached = await getCachedProducts();
    if (cached.length) setProducts(cached);
  }

  useEffect(() => {
    cacheProducts(initialProducts).catch(() => {});
    loadProducts();
    const onSynced = () => loadProducts();
    window.addEventListener("pos-synced", onSynced);
    return () => window.removeEventListener("pos-synced", onSynced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryId && p.categoryId !== categoryId) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, categoryId]);

  const totals = useMemo(() => {
    const lines: SaleLineInput[] = cart.lines.map((l) => ({
      productId: l.productId,
      name: l.name,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineDiscount: l.lineDiscount,
    }));
    return computeSaleTotals(lines, cart.cartDiscount);
  }, [cart.lines, cart.cartDiscount]);

  async function handleConfirmPayment(
    method: "CASH" | "CARD" | "DIGITAL_WALLET" | "SPLIT",
    payments?: PaymentSplit[]
  ) {
    setSubmitting(true);
    setError(null);
    const result = await submitSale({
      lines: cart.lines,
      cartDiscount: cart.cartDiscount,
      customer: cart.customer,
      paymentMethod: method,
      payments,
      online,
      cashierName,
    });
    setSubmitting(false);

    if (!result.ok) {
      const detail = result.insufficient
        ?.map((i) => `${i.name} (have ${i.available}, need ${i.requested})`)
        .join(", ");
      setError(detail ? `${result.error} ${detail}` : result.error);
      return;
    }

    setPaying(false);
    cart.clear();
    setReceipt({ sale: result.sale, queued: result.queued });
    await loadProducts();
  }

  const currency = store.currency;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      {/* Products */}
      <section className="flex flex-col gap-3 lg:h-[calc(100dvh-7rem)]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />

        {/* Product tiles */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {filtered.map((p) => {
              const out = p.stockQuantity <= 0;
              const low = !out && p.stockQuantity <= p.lowStockThreshold;
              return (
                <button
                  key={p.id}
                  onClick={() => cart.addProduct(p)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left shadow-sm transition active:scale-[0.97]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl || FALLBACK_IMG}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span
                    className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      out
                        ? "bg-red-600 text-white"
                        : low
                        ? "bg-amber-500 text-white"
                        : "bg-black/55 text-white"
                    }`}
                  >
                    {out ? "Out" : p.stockQuantity}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
                    <p className="line-clamp-2 text-xs font-semibold leading-tight text-white">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-white">
                      {formatCurrency(p.price, currency)}
                    </p>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full py-10 text-center text-slate-400">
                No products.
              </p>
            )}
          </div>
        </div>

        {/* Category tabs (bottom) */}
        <div className="-mb-1 flex gap-2 overflow-x-auto border-t border-slate-200 pt-3">
          <CategoryTab label="All" active={categoryId === ""} onClick={() => setCategoryId("")} />
          {categories.map((c) => (
            <CategoryTab
              key={c.id}
              label={c.name}
              active={categoryId === c.id}
              onClick={() => setCategoryId(c.id)}
            />
          ))}
        </div>
      </section>

      {/* Cart */}
      <section className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold">
              Ticket {mounted && cart.count() > 0 && `(${cart.count()})`}
            </h2>
            {mounted && cart.lines.length > 0 && (
              <button
                onClick={() => cart.clear()}
                className="text-xs text-slate-400 hover:text-red-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="border-b border-slate-100 px-4 py-2">
            <button
              onClick={() => setPickingCustomer(true)}
              className="flex w-full items-center justify-between text-sm"
            >
              <span className="text-slate-500">Customer</span>
              <span className="font-medium text-indigo-700">
                {mounted && cart.customer ? cart.customer.name : "Walk-in"}
              </span>
            </button>
          </div>

          <div className="max-h-[38vh] overflow-y-auto lg:max-h-[42vh]">
            {!mounted || cart.lines.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">
                Tap products to add them.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {cart.lines.map((l) => (
                  <li key={l.productId} className="px-4 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{l.name}</p>
                        <p className="text-xs text-slate-400">
                          {formatCurrency(l.unitPrice, currency)} each
                        </p>
                      </div>
                      <button
                        onClick={() => cart.removeLine(l.productId)}
                        className="text-slate-300 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => cart.increment(l.productId, -1)}
                          className="h-7 w-7 rounded-lg border border-slate-300 text-lg leading-none"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-sm font-medium">{l.quantity}</span>
                        <button
                          onClick={() => cart.increment(l.productId, 1)}
                          className="h-7 w-7 rounded-lg border border-slate-300 text-lg leading-none"
                        >
                          +
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={l.lineDiscount || ""}
                        onChange={(e) =>
                          cart.setLineDiscount(l.productId, parseFloat(e.target.value) || 0)
                        }
                        placeholder="disc"
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-xs"
                        title="Line discount"
                      />
                      <span className="w-16 text-right text-sm font-semibold">
                        {formatCurrency(
                          Math.max(0, l.unitPrice * l.quantity - l.lineDiscount),
                          currency
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-1.5 border-t border-slate-100 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Cart discount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={mounted ? cart.cartDiscount || "" : ""}
                onChange={(e) => cart.setCartDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
              />
            </div>
            <Row label="Subtotal" value={formatCurrency(totals.itemsSubtotal, currency)} />
            {totals.totalDiscount > 0 && (
              <Row label="Discount" value={`−${formatCurrency(totals.totalDiscount, currency)}`} />
            )}
            <Row label="Tax" value={formatCurrency(totals.taxAmount, currency)} />
            <div className="flex justify-between pt-1 text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(totals.total, currency)}</span>
            </div>

            <button
              disabled={!mounted || cart.lines.length === 0}
              onClick={() => {
                setError(null);
                setPaying(true);
              }}
              className="mt-2 w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm active:scale-95 disabled:opacity-50"
            >
              Charge {mounted ? formatCurrency(totals.total, currency) : ""}
            </button>
            {!online && (
              <p className="text-center text-xs text-amber-600">
                Offline — sale will be saved and synced later.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Overlays */}
      {paying && (
        <PaymentModal
          total={totals.total}
          currency={currency}
          submitting={submitting}
          onConfirm={handleConfirmPayment}
          onClose={() => setPaying(false)}
        />
      )}
      {error && paying && (
        <div className="fixed inset-x-0 bottom-4 z-[60] mx-auto max-w-sm px-4">
          <p className="rounded-lg bg-red-600 px-4 py-2 text-center text-sm text-white shadow-lg">
            {error}
          </p>
        </div>
      )}
      {receipt && (
        <Receipt
          sale={receipt.sale}
          store={store}
          queued={receipt.queued}
          onClose={() => setReceipt(null)}
          onNewSale={() => setReceipt(null)}
        />
      )}
      {pickingCustomer && (
        <CustomerPicker
          customers={customers}
          onPick={(c) => {
            cart.setCustomer(c ? { id: c.id, name: c.name } : null);
            setPickingCustomer(false);
          }}
          onClose={() => setPickingCustomer(false)}
        />
      )}
    </div>
  );
}

function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function CustomerPicker({
  customers,
  onPick,
  onClose,
}: {
  customers: CustomerLite[];
  onPick: (c: CustomerLite | null) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const list = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.phone ?? "").includes(q)
  );
  return (
    <Modal title="Select customer" onClose={onClose} size="sm">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name or phone…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
      />
      <button
        onClick={() => onPick(null)}
        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-medium hover:bg-slate-50"
      >
        🚶 Walk-in (no customer)
      </button>
      <ul className="mt-2 max-h-72 divide-y divide-slate-100 overflow-y-auto">
        {list.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onPick(c)}
              className="w-full px-1 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-medium">{c.name}</span>
              {c.phone && <span className="ml-2 text-slate-400">{c.phone}</span>}
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="py-4 text-center text-sm text-slate-400">No matches</li>
        )}
      </ul>
    </Modal>
  );
}
