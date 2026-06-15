import { createClient } from "@/lib/supabase/server";
import { TYPE_LABELS, typeLabel } from "@/lib/services/portfolio-constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HoldingRow {
  id: string;
  asset_name: string;
  asset_type: string;
  buy_price: number;
  current_price: number;
  quantity: number;
  currency: string;
  rate_at_entry: number;
  buy_date: string;
  price_updated_at: string;
  // computed
  invested_base: number;
  current_value_base: number;
  pnl_base: number;
  pnl_pct: number;
  is_stale: boolean;
  stale_days: number;
}

export interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  total_pnl: number;
  pnl_pct: number;
}

export interface AllocationSlice {
  type: string;
  label: string;
  value: number;
  pct: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STALE_MS = 7 * 24 * 60 * 60 * 1000;

// ─── Compute helpers ──────────────────────────────────────────────────────────

function computeHolding(h: {
  id: string; asset_name: string; asset_type: string;
  buy_price: number; current_price: number; quantity: number;
  currency: string; rate_at_entry: number;
  buy_date: string; price_updated_at: string;
}): HoldingRow {
  const rate              = h.rate_at_entry ?? 1;
  const invested_base     = h.buy_price * h.quantity * rate;
  const current_value_base = h.current_price * h.quantity * rate;
  const pnl_base          = current_value_base - invested_base;
  const pnl_pct           = h.buy_price > 0
    ? ((h.current_price - h.buy_price) / h.buy_price) * 100
    : 0;
  const ageMs    = Date.now() - new Date(h.price_updated_at).getTime();
  const is_stale = ageMs > STALE_MS;
  const stale_days = Math.floor(ageMs / 86_400_000);

  return {
    ...h,
    rate_at_entry: rate,
    invested_base,
    current_value_base,
    pnl_base,
    pnl_pct,
    is_stale,
    stale_days,
  };
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function getHoldings(): Promise<HoldingRow[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("investments")
      .select("id, asset_name, asset_type, buy_price, current_price, quantity, currency, rate_at_entry, buy_date, price_updated_at")
      .eq("user_id", user.id)
      .order("asset_type")
      .order("asset_name");
    return (data ?? []).map(h => computeHolding(h));
  } catch {
    return [];
  }
}

export function computeSummary(holdings: HoldingRow[]): PortfolioSummary {
  const total_invested = holdings.reduce((s, h) => s + h.invested_base, 0);
  const current_value  = holdings.reduce((s, h) => s + h.current_value_base, 0);
  const total_pnl      = current_value - total_invested;
  const pnl_pct        = total_invested > 0 ? (total_pnl / total_invested) * 100 : 0;
  return { total_invested, current_value, total_pnl, pnl_pct };
}

export function computeAllocation(holdings: HoldingRow[]): AllocationSlice[] {
  const total = holdings.reduce((s, h) => s + h.current_value_base, 0);
  if (total === 0) return [];
  const map: Record<string, number> = {};
  for (const h of holdings) {
    map[h.asset_type] = (map[h.asset_type] ?? 0) + h.current_value_base;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([type, value]) => ({
      type,
      label: typeLabel(type),
      value,
      pct: (value / total) * 100,
    }));
}

/** Returns "X days ago" if any holding price is stale, or null. */
export function stalenessLabel(holdings: HoldingRow[]): string | null {
  const maxDays = holdings
    .filter(h => h.is_stale)
    .reduce((m, h) => Math.max(m, h.stale_days), -1);
  if (maxDays < 0) return null;
  return maxDays === 0 ? "today" : `${maxDays} day${maxDays !== 1 ? "s" : ""} ago`;
}
