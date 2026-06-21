export function formatCurrency(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    // Fallback if an unknown currency code is supplied.
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}
