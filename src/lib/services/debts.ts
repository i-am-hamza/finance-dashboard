import { createClient } from "@/lib/supabase/server";
import { getLastNMonths, monthLabel } from "@/lib/utils/date";

export interface Loan {
  id: string;
  lender: string;
  loan_type: string;
  principal: number;
  outstanding: number;
  interest_rate: number;
  emi_amount: number;
  currency: string;
  rate_at_entry: number;
  due_day: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EmiPaymentRow {
  id: string;
  loan_id: string;
  lender: string;
  loan_type: string;
  payment_date: string;
  amount_paid: number;
  currency: string;
  rate_at_entry: number;
  principal_component: number | null;
  interest_component: number | null;
  outstanding_after: number;
}

export interface EmiTrendPoint {
  month: string;
  total: number;
}

export async function getLoans(): Promise<Loan[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("loans")
      .select(
        "id, lender, loan_type, principal, outstanding, interest_rate, emi_amount, currency, rate_at_entry, due_day, start_date, end_date, status, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getEmiPayments(): Promise<EmiPaymentRow[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const [paymentsRes, loansRes] = await Promise.all([
      supabase
        .from("emi_payments")
        .select("id, loan_id, payment_date, amount_paid, currency, rate_at_entry, principal_component, interest_component, outstanding_after")
        .eq("user_id", user.id)
        .order("payment_date", { ascending: false })
        .limit(200),
      supabase
        .from("loans")
        .select("id, lender, loan_type")
        .eq("user_id", user.id),
    ]);

    const loanMap: Record<string, { lender: string; loan_type: string }> = Object.fromEntries(
      (loansRes.data ?? []).map(l => [l.id, { lender: l.lender, loan_type: l.loan_type }])
    );

    return (paymentsRes.data ?? []).map(p => ({
      ...p,
      lender:    loanMap[p.loan_id]?.lender    ?? "Unknown",
      loan_type: loanMap[p.loan_id]?.loan_type ?? "Other",
    }));
  } catch {
    return [];
  }
}

export async function getEmiTrend(): Promise<EmiTrendPoint[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const months = getLastNMonths(6);
    if (!user) return months.map(mk => ({ month: monthLabel(mk), total: 0 }));

    const { data } = await supabase
      .from("emi_payments")
      .select("payment_date, amount_paid, rate_at_entry")
      .eq("user_id", user.id)
      .gte("payment_date", months[0] + "-01");

    const byMonth: Record<string, number> = {};
    for (const mk of months) byMonth[mk] = 0;
    for (const r of (data ?? [])) {
      const mk = r.payment_date.slice(0, 7);
      if (mk in byMonth) byMonth[mk] += r.amount_paid * r.rate_at_entry;
    }
    return months.map(mk => ({ month: monthLabel(mk), total: Math.round(byMonth[mk]) }));
  } catch {
    return getLastNMonths(6).map(mk => ({ month: monthLabel(mk), total: 0 }));
  }
}
