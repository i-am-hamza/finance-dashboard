import { createClient } from "@/lib/supabase/server";
import { getLastNMonths } from "@/lib/utils/date";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FireSettings {
  id?: string;
  monthly_expenses_override: number | null;
  current_savings_override: number | null;
  annual_return_rate: number;
  annual_inflation_rate: number;
  current_age: number | null;
  target_retirement_age: number | null;
  currency: string;
}

export interface Goal {
  id: string;
  name: string;
  category: string;
  target_amount: number;
  current_amount: number;
  current_amount_override: number | null;
  monthly_contribution: number | null;
  target_date: string | null;
  currency: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface GoalsAutoData {
  avgMonthlyExpenses: number;
  avgMonthlyIncome: number;
  totalSavings: number;
}

export interface GoalsSummaryData {
  firePct: number;
  fireYearsLeft: number | null;
  fireCorpusNeeded: number;
  fireCurrentSavings: number;
  topGoals: { name: string; pct: number }[];
  hasGoals: boolean;
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function getFireSettings(): Promise<FireSettings> {
  const defaults: FireSettings = {
    monthly_expenses_override: null,
    current_savings_override: null,
    annual_return_rate: 12,
    annual_inflation_rate: 6,
    current_age: null,
    target_retirement_age: null,
    currency: "INR",
  };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return defaults;

    const { data } = await supabase
      .from("fire_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) return defaults;

    return {
      id: data.id,
      monthly_expenses_override: data.monthly_expenses_override != null ? Number(data.monthly_expenses_override) : null,
      current_savings_override: data.current_savings_override != null ? Number(data.current_savings_override) : null,
      annual_return_rate: Number(data.annual_return_rate ?? 12),
      annual_inflation_rate: Number(data.annual_inflation_rate ?? 6),
      current_age: data.current_age,
      target_retirement_age: data.target_retirement_age,
      currency: data.currency ?? "INR",
    };
  } catch {
    return defaults;
  }
}

export async function getGoals(): Promise<Goal[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return (data ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      category: g.category ?? "Other",
      target_amount: Number(g.target_amount),
      current_amount: Number(g.current_amount ?? 0),
      current_amount_override: g.current_amount_override != null ? Number(g.current_amount_override) : null,
      monthly_contribution: g.monthly_contribution != null ? Number(g.monthly_contribution) : null,
      target_date: g.target_date,
      currency: g.currency ?? "INR",
      status: g.status ?? "active",
      notes: g.notes,
      created_at: g.created_at,
    }));
  } catch {
    return [];
  }
}

export async function getGoalsAutoData(): Promise<GoalsAutoData> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { avgMonthlyExpenses: 0, avgMonthlyIncome: 0, totalSavings: 0 };

    const months = getLastNMonths(3);
    const threeMonthsAgo = months[0] + "-01";

    const [expRes, incRes, cashRes, invRes] = await Promise.all([
      supabase.from("budget_expenses").select("amount, rate_at_entry").eq("user_id", user.id).gte("date", threeMonthsAgo),
      supabase.from("income").select("amount, rate_at_entry").eq("user_id", user.id).gte("date", threeMonthsAgo),
      supabase.from("cash_accounts").select("balance, rate_at_entry").eq("user_id", user.id),
      supabase.from("investments").select("current_price, quantity, rate_at_entry").eq("user_id", user.id),
    ]);

    const totalExp = (expRes.data ?? []).reduce((s, r) => s + Number(r.amount) * Number(r.rate_at_entry), 0);
    const totalInc = (incRes.data ?? []).reduce((s, r) => s + Number(r.amount) * Number(r.rate_at_entry), 0);
    const cashTotal = (cashRes.data ?? []).reduce((s, a) => s + Number(a.balance) * Number(a.rate_at_entry), 0);
    const invTotal = (invRes.data ?? []).reduce(
      (s, i) => s + Number(i.current_price) * Number(i.quantity) * Number(i.rate_at_entry ?? 1), 0
    );

    return {
      avgMonthlyExpenses: Math.round(totalExp / 3),
      avgMonthlyIncome: Math.round(totalInc / 3),
      totalSavings: Math.round(cashTotal + invTotal),
    };
  } catch {
    return { avgMonthlyExpenses: 0, avgMonthlyIncome: 0, totalSavings: 0 };
  }
}

export async function getGoalsSummaryData(): Promise<GoalsSummaryData> {
  try {
    const [fireSettings, autoData, goals] = await Promise.all([
      getFireSettings(),
      getGoalsAutoData(),
      getGoals(),
    ]);

    const monthlyExpenses = fireSettings.monthly_expenses_override ?? autoData.avgMonthlyExpenses;
    const currentSavings = fireSettings.current_savings_override ?? autoData.totalSavings;
    const corpusNeeded = monthlyExpenses > 0 ? (monthlyExpenses * 12) / 0.04 : 0;
    const firePct = corpusNeeded > 0 ? Math.min((currentSavings / corpusNeeded) * 100, 100) : 0;

    let yearsLeft: number | null = null;
    if (corpusNeeded > 0 && currentSavings < corpusNeeded) {
      const returnRate = fireSettings.annual_return_rate / 100;
      const inflationRate = fireSettings.annual_inflation_rate / 100;
      const realReturnRate = ((1 + returnRate) / (1 + inflationRate)) - 1;
      const r = Math.pow(1 + realReturnRate, 1 / 12) - 1;
      const monthlySavings = autoData.avgMonthlyIncome - monthlyExpenses;

      if (monthlySavings > 0) {
        if (r > 0.0001) {
          const n = Math.log(
            (corpusNeeded * r + monthlySavings) / (currentSavings * r + monthlySavings)
          ) / Math.log(1 + r);
          yearsLeft = n > 0 ? Math.round((n / 12) * 10) / 10 : null;
        } else {
          yearsLeft = Math.round(((corpusNeeded - currentSavings) / monthlySavings / 12) * 10) / 10;
        }
      }
    }

    const topGoals = goals
      .filter((g) => g.status !== "achieved" && g.status !== "paused")
      .map((g) => ({
        name: g.name,
        pct: g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 2);

    return {
      firePct: Math.round(firePct),
      fireYearsLeft: yearsLeft,
      fireCorpusNeeded: corpusNeeded,
      fireCurrentSavings: currentSavings,
      topGoals,
      hasGoals: goals.length > 0,
    };
  } catch {
    return { firePct: 0, fireYearsLeft: null, fireCorpusNeeded: 0, fireCurrentSavings: 0, topGoals: [], hasGoals: false };
  }
}
