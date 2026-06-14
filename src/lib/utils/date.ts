/** Returns last N month keys as "YYYY-MM", oldest first. */
export function getLastNMonths(n: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return result;
}

/** "YYYY-MM" → short display label e.g. "Jun '25" */
export function monthLabel(isoMonth: string): string {
  const [y, m] = isoMonth.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}

/** Shift a "YYYY-MM" key by ±N months. */
export function shiftMonthKey(mk: string, delta: number): string {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Advance a "YYYY-MM-DD" date by one billing cycle. */
export function advanceByBillingCycle(iso: string, cycle: string): string {
  const d = new Date(iso);
  switch (cycle) {
    case "Weekly":    d.setDate(d.getDate() + 7); break;
    case "Monthly":   d.setMonth(d.getMonth() + 1); break;
    case "Quarterly": d.setMonth(d.getMonth() + 3); break;
    case "Yearly":    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split("T")[0];
}

/** Current month as "YYYY-MM". */
export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** First and last day of the given "YYYY-MM" month as ISO date strings. */
export function monthBounds(isoMonth: string): { start: string; end: string } {
  const [y, m] = isoMonth.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    start: `${isoMonth}-01`,
    end:   `${isoMonth}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Today as "YYYY-MM-DD". */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/** Today + days as "YYYY-MM-DD". */
export function futureDateISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/** Next date in calendar when this loan's EMI falls due. */
export function getNextEmiDueDate(dueDay: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(today.getFullYear(), today.getMonth(), dueDay);
  return candidate >= today
    ? candidate
    : new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
}

/** "YYYY-MM-DD" → "15 Jun 2025" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "YYYY-MM-DD" → "15 Jun" */
export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

/** Days until an ISO date from today (negative = past). */
export function daysUntil(iso: string): number {
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
