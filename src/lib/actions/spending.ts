"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Budget category ──────────────────────────────────────────────────────────

export async function setBudgetCategory(_prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const month    = formData.get("month") as string;
    const category = (formData.get("category") as string).trim();
    const currency = (formData.get("currency") as string) || "INR";
    const rate     = parseFloat((formData.get("rate_at_entry") as string) || "1") || 1;
    const budgeted = parseFloat(formData.get("budgeted_amount") as string) || 0;

    // Upsert via select-then-insert/update
    const { data: existing } = await supabase
      .from("budget_categories")
      .select("id")
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("category", category)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("budget_categories")
        .update({ budgeted_amount: budgeted, currency, rate_at_entry: currency === "INR" ? 1 : rate })
        .eq("id", existing.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("budget_categories")
        .insert({
          user_id:        user.id,
          month,
          category,
          budgeted_amount: budgeted,
          currency,
          rate_at_entry:  currency === "INR" ? 1 : rate,
        });
      if (error) return { error: error.message };
    }

    revalidatePath("/spending");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function deleteBudgetCategory(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase
      .from("budget_categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/spending");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Budget expenses ──────────────────────────────────────────────────────────

export async function addExpense(_prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const currency = (formData.get("currency") as string) || "INR";
    const rate     = parseFloat((formData.get("rate_at_entry") as string) || "1") || 1;

    const { error } = await supabase.from("budget_expenses").insert({
      user_id:      user.id,
      date:         formData.get("date") as string,
      amount:       parseFloat(formData.get("amount") as string),
      currency,
      rate_at_entry: currency === "INR" ? 1 : rate,
      category:     (formData.get("category") as string).trim(),
      note:         (formData.get("note") as string) || null,
      source:       "manual",
      is_auto:      false,
    });
    if (error) return { error: error.message };

    revalidatePath("/spending");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function deleteExpense(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Explicit guard — RLS also enforces this, but we return a clear error rather
    // than a silent no-op when the caller somehow reaches an auto entry.
    const { data: row } = await supabase
      .from("budget_expenses")
      .select("is_auto")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (row?.is_auto) return { error: "Auto-generated entries cannot be deleted" };

    const { error } = await supabase
      .from("budget_expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/spending");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function addSubscription(_prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const currency = (formData.get("currency") as string) || "INR";
    const rate     = parseFloat((formData.get("rate_at_entry") as string) || "1") || 1;

    const { error } = await supabase.from("subscriptions").insert({
      user_id:           user.id,
      service_name:      formData.get("service_name") as string,
      amount:            parseFloat(formData.get("amount") as string),
      currency,
      rate_at_entry:     currency === "INR" ? 1 : rate,
      billing_cycle:     formData.get("billing_cycle") as string,
      next_renewal_date: formData.get("next_renewal_date") as string,
      category:          (formData.get("category") as string) || null,
      status:            (formData.get("status") as string) || "Active",
      notes:             (formData.get("notes") as string) || null,
    });
    if (error) return { error: error.message };

    revalidatePath("/spending");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function updateSubscription(id: string, _prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const currency = (formData.get("currency") as string) || "INR";
    const rate     = parseFloat((formData.get("rate_at_entry") as string) || "1") || 1;

    const { error } = await supabase
      .from("subscriptions")
      .update({
        service_name:      formData.get("service_name") as string,
        amount:            parseFloat(formData.get("amount") as string),
        currency,
        rate_at_entry:     currency === "INR" ? 1 : rate,
        billing_cycle:     formData.get("billing_cycle") as string,
        next_renewal_date: formData.get("next_renewal_date") as string,
        category:          (formData.get("category") as string) || null,
        status:            formData.get("status") as string,
        notes:             (formData.get("notes") as string) || null,
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/spending");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function deleteSubscription(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/spending");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

interface ImportRow {
  service_name:      string;
  amount:            number;
  currency:          string;
  billing_cycle:     string;
  next_renewal_date: string;
  category:          string;
  status:            string;
  notes:             string | null;
}

// ─── Expense bulk import ──────────────────────────────────────────────────────

export async function bulkImportExpenses(rows: Array<Record<string, string>>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    if (!rows.length) return { error: "No rows to import" };

    const { error } = await supabase.from("budget_expenses").insert(
      rows.map(r => ({
        user_id:      user.id,
        date:         r.date || "",
        amount:       parseFloat(r.amount) || 0,
        currency:     r.currency || "INR",
        rate_at_entry: 1,
        category:     r.category || "Other",
        note:         r.note || null,
        source:       "manual",
        is_auto:      false,
      })),
    );
    if (error) return { error: error.message };
    revalidatePath("/spending");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Subscriptions bulk import ────────────────────────────────────────────────

export async function bulkImportSubscriptions(rows: ImportRow[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    if (!rows.length) return { error: "No rows to import" };

    const inserts = rows.map(r => ({
      user_id:           user.id,
      service_name:      r.service_name,
      amount:            r.amount,
      currency:          r.currency,
      rate_at_entry:     r.currency === "INR" ? 1 : 1, // user can edit after import
      billing_cycle:     r.billing_cycle,
      next_renewal_date: r.next_renewal_date,
      category:          r.category || null,
      status:            r.status,
      notes:             r.notes || null,
    }));

    const { error } = await supabase.from("subscriptions").insert(inserts);
    if (error) return { error: error.message };
    revalidatePath("/spending");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}
