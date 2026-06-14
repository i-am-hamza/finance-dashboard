import { createClient } from "@/lib/supabase/server";
import {
  getLastNMonths,
  monthLabel,
  currentMonthKey,
  monthBounds,
  todayISO,
  futureDateISO,
  getNextEmiDueDate,
} from "@/lib/utils/date";
import { toMonthlyAmount } from "@/lib/utils/currency";

// ─── Return types ─────────────────────────────────────────────────────────────

export interface NetWorthData {
  current: number;
  deltaPercent: number | null;
  cash: number;
  investments: number;
  debt: number;
}

export interface MonthlySummary {
  income: number;
  expenses: number;
  savingsRate: number | null;     // null when income = 0
  emiMonthly: number;
  subscriptionMonthly: number;
  budgetHealthPct: number | null; // null = no budget set this month
}

export interface ChartPoint {
  month: string; // display label e.g. "Jun '25"
  value: number;
}

export interface IncomeExpensePoint {
  month: string;
  income: number;
  expenses: number;
}

export interface AllocationSlice {
  name: string;
  value: number;
  color: string;
}

export interface UpcomingItem {
  id: string;
  type: "emi" | "subscription";
  name: string;
  amount: number;
  currency: string;
  dueDate: string; // "YYYY-MM-DD"
}

// ─── Colour maps ──────────────────────────────────────────────────────────────

const ACCOUNT_COLORS: Record<string, string> = {
  Savings:      "#475569",
  Current:      "#64748b",
  FixedDeposit: "#94a3b8",
  Wallet:       "#cbd5e1",
  Cash:         "#e2e8f0",
};

const INVESTMENT_COLORS: Record<string, string> = {
  Stocks:      "#2563eb",
  MutualFund:  "#3b82f6",
  FD:          "#60a5fa",
  Crypto:      "#f59e0b",
  RealEstate:  "#10b981",
  Gold:        "#d97706",
  Other:       "#6b7280",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sumBase(rows: { amount: number; rate_at_entry: number }[]): number {
  return rows.reduce((s, r) => s + r.amount * r.rate_at_entry, 0);
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function getNetWorthData(): Promise<NetWorthData> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { current: 0, deltaPercent: null, cash: 0, investments: 0, debt: 0 };

    const mk = currentMonthKey();
    const { start, end } = monthBounds(mk);

    const [accountsRes, investmentsRes, loansRes, incomeRes, expensesRes] = await Promise.all([
      supabase.from("cash_accounts").select("balance, rate_at_entry").eq("user_id", user.id),
      supabase.from("investments").select("current_price, quantity, rate_at_entry").eq("user_id", user.id),
      supabase.from("loans").select("outstanding, rate_at_entry").eq("user_id", user.id).eq("status", "Active"),
      supabase.from("income").select("amount, rate_at_entry").eq("user_id", user.id).gte("date", start).lte("date", end),
      supabase.from("budget_expenses").select("amount, rate_at_entry").eq("user_id", user.id).gte("date", start).lte("date", end),
    ]);

    const cash        = (accountsRes.data   ?? []).reduce((s, a) => s + a.balance * a.rate_at_entry, 0);
    const investments = (investmentsRes.data ?? []).reduce((s, i) => s + i.current_price * i.quantity * (i.rate_at_entry ?? 1), 0);
    const debt        = (loansRes.data       ?? []).reduce((s, l) => s + l.outstanding * l.rate_at_entry, 0);
    const current     = cash + investments - debt;

    const thisMonthIncome   = sumBase(incomeRes.data   ?? []);
    const thisMonthExpenses = sumBase(expensesRes.data ?? []);

    // Estimate last month's net worth by reversing this month's cash flow
    const lastMonth    = current - thisMonthIncome + thisMonthExpenses;
    const deltaPercent = lastMonth !== 0
      ? ((current - lastMonth) / Math.abs(lastMonth)) * 100
      : null;

    return { current, deltaPercent, cash, investments, debt };
  } catch {
    return { current: 0, deltaPercent: null, cash: 0, investments: 0, debt: 0 };
  }
}

export async function getMonthlySummary(): Promise<MonthlySummary> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { income: 0, expenses: 0, savingsRate: null, emiMonthly: 0, subscriptionMonthly: 0, budgetHealthPct: null };

    const mk = currentMonthKey();
    const { start, end } = monthBounds(mk);

    const [incomeRes, loansRes, subsRes, budgetCatRes, budgetExpRes] = await Promise.all([
      supabase.from("income").select("amount, rate_at_entry").eq("user_id", user.id).gte("date", start).lte("date", end),
      supabase.from("loans").select("emi_amount, rate_at_entry").eq("user_id", user.id).eq("status", "Active"),
      supabase.from("subscriptions").select("amount, rate_at_entry, billing_cycle").eq("user_id", user.id).eq("status", "Active"),
      supabase.from("budget_categories").select("budgeted_amount, rate_at_entry").eq("user_id", user.id).eq("month", mk),
      supabase.from("budget_expenses").select("amount, rate_at_entry").eq("user_id", user.id).gte("date", start).lte("date", end),
    ]);

    const income               = sumBase(incomeRes.data ?? []);
    const expenses             = sumBase(budgetExpRes.data ?? []);
    const emiMonthly           = (loansRes.data ?? []).reduce((s, l) => s + l.emi_amount * l.rate_at_entry, 0);
    const subscriptionMonthly  = (subsRes.data  ?? []).reduce((s, sub) =>
      s + toMonthlyAmount(sub.amount * sub.rate_at_entry, sub.billing_cycle), 0);

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : null;

    const totalBudget = (budgetCatRes.data ?? []).reduce((s, b) => s + b.budgeted_amount * b.rate_at_entry, 0);
    const totalSpent  = expenses;
    const budgetHealthPct = totalBudget > 0
      ? Math.max(0, ((totalBudget - totalSpent) / totalBudget) * 100)
      : null;

    return { income, expenses, savingsRate, emiMonthly, subscriptionMonthly, budgetHealthPct };
  } catch {
    return { income: 0, expenses: 0, savingsRate: null, emiMonthly: 0, subscriptionMonthly: 0, budgetHealthPct: null };
  }
}

export async function getNetWorthHistory(): Promise<ChartPoint[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const months = getLastNMonths(12);
    if (!user) return months.map(mk => ({ month: monthLabel(mk), value: 0 }));

    const twelveMonthsAgo = months[0] + "-01";

    const [accountsRes, investmentsRes, loansRes, incomeRes, expensesRes] = await Promise.all([
      supabase.from("cash_accounts").select("balance, rate_at_entry").eq("user_id", user.id),
      supabase.from("investments").select("current_price, quantity, rate_at_entry").eq("user_id", user.id),
      supabase.from("loans").select("outstanding, rate_at_entry").eq("user_id", user.id).eq("status", "Active"),
      supabase.from("income").select("date, amount, rate_at_entry").eq("user_id", user.id).gte("date", twelveMonthsAgo),
      supabase.from("budget_expenses").select("date, amount, rate_at_entry").eq("user_id", user.id).gte("date", twelveMonthsAgo),
    ]);

    const cash        = (accountsRes.data   ?? []).reduce((s, a) => s + a.balance * a.rate_at_entry, 0);
    const investments = (investmentsRes.data ?? []).reduce((s, i) => s + i.current_price * i.quantity * (i.rate_at_entry ?? 1), 0);
    const debt        = (loansRes.data       ?? []).reduce((s, l) => s + l.outstanding * l.rate_at_entry, 0);
    const currentNW   = cash + investments - debt;

    // Group income and expenses by month key
    const byMonth: Record<string, { inc: number; exp: number }> = {};
    for (const mk of months) byMonth[mk] = { inc: 0, exp: 0 };

    for (const r of (incomeRes.data ?? []))   byMonth[r.date.slice(0, 7)].inc  += r.amount * r.rate_at_entry;
    for (const r of (expensesRes.data ?? [])) byMonth[r.date.slice(0, 7)].exp  += r.amount * r.rate_at_entry;

    // Walk backward from current to reconstruct monthly net worth
    const points: ChartPoint[] = [];
    let running = currentNW;
    for (let i = months.length - 1; i >= 0; i--) {
      const mk = months[i];
      points.unshift({ month: monthLabel(mk), value: Math.round(running) });
      if (i > 0) {
        running -= byMonth[mk].inc;
        running += byMonth[mk].exp;
      }
    }
    return points;
  } catch {
    return getLastNMonths(12).map(mk => ({ month: monthLabel(mk), value: 0 }));
  }
}

export async function getIncomeExpenseTrend(): Promise<IncomeExpensePoint[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const months = getLastNMonths(6);
    if (!user) return months.map(mk => ({ month: monthLabel(mk), income: 0, expenses: 0 }));

    const sixMonthsAgo = months[0] + "-01";

    const [incomeRes, expensesRes] = await Promise.all([
      supabase.from("income").select("date, amount, rate_at_entry").eq("user_id", user.id).gte("date", sixMonthsAgo),
      supabase.from("budget_expenses").select("date, amount, rate_at_entry").eq("user_id", user.id).gte("date", sixMonthsAgo),
    ]);

    const incomeByMonth:   Record<string, number> = {};
    const expensesByMonth: Record<string, number> = {};
    for (const mk of months) { incomeByMonth[mk] = 0; expensesByMonth[mk] = 0; }

    for (const r of (incomeRes.data   ?? [])) incomeByMonth[r.date.slice(0, 7)]   += r.amount * r.rate_at_entry;
    for (const r of (expensesRes.data ?? [])) expensesByMonth[r.date.slice(0, 7)] += r.amount * r.rate_at_entry;

    return months.map(mk => ({
      month:    monthLabel(mk),
      income:   Math.round(incomeByMonth[mk]),
      expenses: Math.round(expensesByMonth[mk]),
    }));
  } catch {
    return getLastNMonths(6).map(mk => ({ month: monthLabel(mk), income: 0, expenses: 0 }));
  }
}

export async function getAssetAllocation(): Promise<AllocationSlice[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const [accountsRes, investmentsRes] = await Promise.all([
      supabase.from("cash_accounts").select("account_type, balance, rate_at_entry").eq("user_id", user.id),
      supabase.from("investments").select("asset_type, current_price, quantity, rate_at_entry").eq("user_id", user.id),
    ]);

    const cashMap: Record<string, number> = {};
    for (const a of (accountsRes.data ?? [])) {
      cashMap[a.account_type] = (cashMap[a.account_type] ?? 0) + a.balance * a.rate_at_entry;
    }

    const invMap: Record<string, number> = {};
    for (const i of (investmentsRes.data ?? [])) {
      invMap[i.asset_type] = (invMap[i.asset_type] ?? 0) + i.current_price * i.quantity * (i.rate_at_entry ?? 1);
    }

    const slices: AllocationSlice[] = [
      ...Object.entries(cashMap)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value: Math.round(value), color: ACCOUNT_COLORS[name] ?? "#94a3b8" })),
      ...Object.entries(invMap)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value: Math.round(value), color: INVESTMENT_COLORS[name] ?? "#6b7280" })),
    ];

    return slices;
  } catch {
    return [];
  }
}

export async function getUpcomingItems(): Promise<UpcomingItem[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const today  = todayISO();
    const in30   = futureDateISO(30);

    const [loansRes, subsRes] = await Promise.all([
      supabase.from("loans")
        .select("id, lender, loan_type, emi_amount, currency, rate_at_entry, due_day")
        .eq("user_id", user.id)
        .eq("status", "Active"),
      supabase.from("subscriptions")
        .select("id, service_name, amount, currency, rate_at_entry, next_renewal_date")
        .eq("user_id", user.id)
        .eq("status", "Active")
        .gte("next_renewal_date", today)
        .lte("next_renewal_date", in30),
    ]);

    const emiItems: UpcomingItem[] = (loansRes.data ?? [])
      .map(loan => {
        const dueDate = getNextEmiDueDate(loan.due_day);
        if (dueDate.toISOString().split("T")[0] > in30) return null;
        return {
          id:       loan.id,
          type:     "emi" as const,
          name:     `${loan.lender} — ${loan.loan_type}`,
          amount:   loan.emi_amount * loan.rate_at_entry,
          currency: loan.currency,
          dueDate:  dueDate.toISOString().split("T")[0],
        };
      })
      .filter(Boolean) as UpcomingItem[];

    const subItems: UpcomingItem[] = (subsRes.data ?? []).map(sub => ({
      id:       sub.id,
      type:     "subscription" as const,
      name:     sub.service_name,
      amount:   sub.amount * sub.rate_at_entry,
      currency: sub.currency,
      dueDate:  sub.next_renewal_date,
    }));

    return [...emiItems, ...subItems].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  } catch {
    return [];
  }
}
