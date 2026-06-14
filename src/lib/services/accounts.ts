import { createClient } from "@/lib/supabase/server";
import {
  getLastNMonths,
  monthLabel,
  monthBounds,
  currentMonthKey,
} from "@/lib/utils/date";

export interface CashAccount {
  id: string;
  name: string;
  account_type: string;
  balance: number;
  currency: string;
  rate_at_entry: number;
  bank_name: string | null;
  notes: string | null;
  fd_maturity_date: string | null;
  fd_interest_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface IncomeEntry {
  id: string;
  source_name: string;
  amount: number;
  currency: string;
  rate_at_entry: number;
  date: string;
  category: string | null;
  notes: string | null;
}

export interface IncomeChartPoint {
  month: string;
  total: number;
}

export async function getAccounts(): Promise<CashAccount[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("cash_accounts")
      .select("id, name, account_type, balance, currency, rate_at_entry, bank_name, notes, fd_maturity_date, fd_interest_rate, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getTotalLiquidAssets(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const { data } = await supabase
      .from("cash_accounts")
      .select("balance, rate_at_entry")
      .eq("user_id", user.id);
    return (data ?? []).reduce((s, a) => s + a.balance * a.rate_at_entry, 0);
  } catch {
    return 0;
  }
}

export async function getCurrentMonthIncome(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const mk = currentMonthKey();
    const { start, end } = monthBounds(mk);
    const { data } = await supabase
      .from("income")
      .select("amount, rate_at_entry")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end);
    return (data ?? []).reduce((s, r) => s + r.amount * r.rate_at_entry, 0);
  } catch {
    return 0;
  }
}

export async function getIncomeLast6Months(): Promise<IncomeChartPoint[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const months = getLastNMonths(6);
    if (!user) return months.map(mk => ({ month: monthLabel(mk), total: 0 }));
    const { data } = await supabase
      .from("income")
      .select("date, amount, rate_at_entry")
      .eq("user_id", user.id)
      .gte("date", months[0] + "-01");
    const byMonth: Record<string, number> = {};
    for (const mk of months) byMonth[mk] = 0;
    for (const r of (data ?? [])) {
      const mk = r.date.slice(0, 7);
      if (mk in byMonth) byMonth[mk] += r.amount * r.rate_at_entry;
    }
    return months.map(mk => ({ month: monthLabel(mk), total: Math.round(byMonth[mk]) }));
  } catch {
    return getLastNMonths(6).map(mk => ({ month: monthLabel(mk), total: 0 }));
  }
}

export async function getIncomeLog(): Promise<IncomeEntry[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("income")
      .select("id, source_name, amount, currency, rate_at_entry, date, category, notes")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(100);
    return data ?? [];
  } catch {
    return [];
  }
}
