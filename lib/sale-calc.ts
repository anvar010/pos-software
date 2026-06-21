// Shared sale math — used by the checkout UI AND the server so totals always
// agree. All amounts are plain numbers (currency units, 2 dp).

export interface SaleLineInput {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // percentage, e.g. 7.5
  lineDiscount: number; // absolute discount on this line
}

export interface SaleLineComputed extends SaleLineInput {
  /** unitPrice * quantity */
  gross: number;
  /** gross - lineDiscount (floored at 0) */
  net: number;
  /** net after the cart-level discount is spread proportionally */
  taxable: number;
  tax: number;
  /** taxable + tax */
  subtotal: number;
}

export interface SaleTotals {
  lines: SaleLineComputed[];
  itemsSubtotal: number; // sum of line gross
  totalDiscount: number; // line discounts + cart discount
  taxAmount: number;
  total: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeSaleTotals(
  lines: SaleLineInput[],
  cartDiscount = 0
): SaleTotals {
  const netLines = lines.map((l) => {
    const gross = round2(l.unitPrice * l.quantity);
    const net = Math.max(0, round2(gross - l.lineDiscount));
    return { ...l, gross, net };
  });

  const netSum = netLines.reduce((s, l) => s + l.net, 0);
  const effectiveCartDiscount = Math.min(Math.max(cartDiscount, 0), netSum);
  // Proportionally spread the cart discount across lines for taxing.
  const factor = netSum > 0 ? (netSum - effectiveCartDiscount) / netSum : 0;

  const computed: SaleLineComputed[] = netLines.map((l) => {
    const taxable = round2(l.net * factor);
    const tax = round2((taxable * l.taxRate) / 100);
    return { ...l, taxable, tax, subtotal: round2(taxable + tax) };
  });

  const itemsSubtotal = round2(netLines.reduce((s, l) => s + l.gross, 0));
  const lineDiscountSum = lines.reduce((s, l) => s + (l.lineDiscount || 0), 0);
  const taxAmount = round2(computed.reduce((s, l) => s + l.tax, 0));
  const taxableTotal = round2(computed.reduce((s, l) => s + l.taxable, 0));

  return {
    lines: computed,
    itemsSubtotal,
    totalDiscount: round2(lineDiscountSum + effectiveCartDiscount),
    taxAmount,
    total: round2(taxableTotal + taxAmount),
  };
}

export function loyaltyPointsFor(total: number, rate: number): number {
  return Math.floor(total * rate);
}
