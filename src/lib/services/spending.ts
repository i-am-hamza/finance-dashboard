import { createClient } from "@/lib/supabase/server";
import { monthBounds, todayISO, advanceByBillingCycle } from "@/lib/utils/date";
import { toMonthlyAmount } from "@/lib/utils/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BudgetCategoryRow {
  category: string;
  budget_id: string | null;
  budgeted: number;   // base currency (INR)
  spent: number;      // base currency
  remaining: number;  // negative = over-budget
}

export interface ExpenseRow {
  id: string;
  date: string;
  category: string;
  amount: number;
  currency: string;
  rate_at_entry: number;
  note: string | null;
  source: string;
  is_auto: boolean;
}

export interface BudgetSummary {
  budgeted: number;
  spent: number;
  remaining: number;
}

export interface SubscriptionRow {
  id: string;
  service_name: string;
  amount: number;
  currency: string;
  rate_at_entry: number;
  billing_cycle: string;
  next_renewal_date: string;
  category: string | null;
  status: string;
  notes: string | null;
  monthly_base: number; // computed: monthly equivalent in base currency
}

// ─── Subscription auto-renewal ────────────────────────────────────────────────

export async function processOverdueSubscriptions(): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = todayISO();
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "Active")
      .lte("next_renewal_date", today);

    for (const sub of (subs ?? [])) {
      let currentDate = sub.next_renewal_date as string;
      let iterations  = 0;

      while (currentDate <= today && iterations < 60) {
        iterations++;

        // Idempotency: skip if expense already created for this date
        const { data: existing } = await supabase
          .from("budget_expenses")
          .select("id")
          .eq("source", "subscription")
          .eq("source_id", sub.id)
          .eq("date", currentDate)
          .maybeSingle();

        if (!existing) {
          await supabase.from("budget_expenses").insert({
            user_id:      user.id,
            date:         currentDate,
            amount:       sub.amount,
            currency:     sub.currency,
            rate_at_entry: sub.rate_at_entry,
            category:     "Subscriptions",
            note:         sub.service_name,
            source:       "subscription",
            source_id:    sub.id,
            is_auto:      true,
          });
        }

        currentDate = advanceByBillingCycle(currentDate, sub.billing_cycle);
      }

      // Advance next_renewal_date to the next future date
      await supabase
        .from("subscriptions")
        .update({ next_renewal_date: currentDate })
        .eq("id", sub.id)
        .eq("user_id", user.id);
    }
  } catch {
    // Best-effort — don't fail the page load
  }
}

// ─── Budget data ──────────────────────────────────────────────────────────────

export async function getBudgetData(month: string): Promise<{
  categories: BudgetCategoryRow[];
  expenses: ExpenseRow[];
  summary: BudgetSummary;
}> {
  const empty = { categories: [], expenses: [], summary: { budgeted: 0, spent: 0, remaining: 0 } };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const { start, end } = monthBounds(month);

    const [catsRes, expRes] = await Promise.all([
      supabase
        .from("budget_categories")
        .select("id, category, budgeted_amount, currency, rate_at_entry")
        .eq("user_id", user.id)
        .eq("month", month),
      supabase
        .from("budget_expenses")
        .select("id, date, category, amount, currency, rate_at_entry, note, source, is_auto")
        .eq("user_id", user.id)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false }),
    ]);

    const budgetMap: Record<string, { id: string; budgeted: number }> = {};
    for (const c of (catsRes.data ?? [])) {
      budgetMap[c.category] = {
        id:       c.id,
        budgeted: c.budgeted_amount * c.rate_at_entry,
      };
    }

    const spentMap: Record<string, number> = {};
    for (const e of (expRes.data ?? [])) {
      spentMap[e.category] = (spentMap[e.category] ?? 0) + e.amount * e.rate_at_entry;
    }

    // Union of all categories (budgeted + any with expenses)
    const allCats = new Set([
      ...Object.keys(budgetMap),
      ...Object.keys(spentMap),
    ]);

    const categories: BudgetCategoryRow[] = Array.from(allCats).map(cat => {
      const budgeted  = budgetMap[cat]?.budgeted ?? 0;
      const spent     = spentMap[cat] ?? 0;
      return {
        category:  cat,
        budget_id: budgetMap[cat]?.id ?? null,
        budgeted,
        spent,
        remaining: budgeted - spent,
      };
    }).sort((a, b) => b.spent - a.spent);

    const expenses: ExpenseRow[] = (expRes.data ?? []) as ExpenseRow[];

    const totalBudgeted = categories.reduce((s, c) => s + c.budgeted, 0);
    const totalSpent    = categories.reduce((s, c) => s + c.spent, 0);

    return {
      categories,
      expenses,
      summary: {
        budgeted:  totalBudgeted,
        spent:     totalSpent,
        remaining: totalBudgeted - totalSpent,
      },
    };
  } catch {
    return empty;
  }
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function getSubscriptions(): Promise<SubscriptionRow[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("subscriptions")
      .select("id, service_name, amount, currency, rate_at_entry, billing_cycle, next_renewal_date, category, status, notes")
      .eq("user_id", user.id)
      .order("status")            // Active < Cancelled < Paused alphabetically — fine
      .order("next_renewal_date");
    return (data ?? []).map(s => ({
      ...s,
      monthly_base: toMonthlyAmount(s.amount * s.rate_at_entry, s.billing_cycle),
    }));
  } catch {
    return [];
  }
}
