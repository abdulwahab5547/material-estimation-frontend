/**
 * Display-only formatters used across the app. Calculations stay in full
 * precision in the engine; rounding only happens right before rendering.
 */

export function formatFt3(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })} ft³`;
}

export function formatNumber(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function formatBricks(n: number): string {
  return Math.ceil(n).toLocaleString();
}

export function formatBags(n: number): string {
  return (Math.ceil(n * 10) / 10).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function formatMoney(amount: number, currency = "PKR"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
