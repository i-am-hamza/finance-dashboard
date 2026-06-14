export function formatCurrency(amount: number, currency = "INR"): string {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 10_000_000) return `${sign}₹${(abs / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000)    return `${sign}₹${(abs / 100_000).toFixed(1)}L`;
  if (abs >= 1_000)      return `${sign}₹${(abs / 1_000).toFixed(0)}K`;
  return formatCurrency(amount);
}

export function convertToBase(amount: number, rateAtEntry: number): number {
  return amount * rateAtEntry;
}

export function toMonthlyAmount(amount: number, billingCycle: string): number {
  switch (billingCycle) {
    case "Weekly":    return (amount * 52) / 12;
    case "Monthly":   return amount;
    case "Quarterly": return amount / 3;
    case "Yearly":    return amount / 12;
    default:          return amount;
  }
}
