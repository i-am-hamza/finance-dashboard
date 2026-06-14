"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Cash Account mutations ───────────────────────────────────────────────────

export async function addAccount(_prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const accountType = formData.get("account_type") as string;
    const currency    = (formData.get("currency") as string) || "INR";
    const rate        = parseFloat((formData.get("rate_at_entry") as string) || "1") || 1;

    const fdirRaw = formData.get("fd_interest_rate") as string;
    const { error } = await supabase.from("cash_accounts").insert({
      user_id:          user.id,
      name:             formData.get("name") as string,
      account_type:     accountType,
      balance:          parseFloat(formData.get("balance") as string) || 0,
      currency,
      rate_at_entry:    currency === "INR" ? 1 : rate,
      bank_name:        (formData.get("bank_name") as string) || null,
      notes:            (formData.get("notes") as string) || null,
      fd_maturity_date: accountType === "FixedDeposit"
        ? ((formData.get("fd_maturity_date") as string) || null)
        : null,
      fd_interest_rate: accountType === "FixedDeposit" && fdirRaw
        ? parseFloat(fdirRaw)
        : null,
    });
    if (error) return { error: error.message };

    revalidatePath("/accounts");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function updateAccount(id: string, _prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const accountType = formData.get("account_type") as string;
    const currency    = (formData.get("currency") as string) || "INR";
    const rate        = parseFloat((formData.get("rate_at_entry") as string) || "1") || 1;

    const fdirRaw2 = formData.get("fd_interest_rate") as string;
    const { error } = await supabase
      .from("cash_accounts")
      .update({
        name:             formData.get("name") as string,
        account_type:     accountType,
        balance:          parseFloat(formData.get("balance") as string) || 0,
        currency,
        rate_at_entry:    currency === "INR" ? 1 : rate,
        bank_name:        (formData.get("bank_name") as string) || null,
        notes:            (formData.get("notes") as string) || null,
        fd_maturity_date: accountType === "FixedDeposit"
          ? ((formData.get("fd_maturity_date") as string) || null)
          : null,
        fd_interest_rate: accountType === "FixedDeposit" && fdirRaw2
          ? parseFloat(fdirRaw2)
          : null,
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/accounts");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function deleteAccount(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("cash_accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/accounts");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Income mutations ─────────────────────────────────────────────────────────

export async function addIncome(_prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const currency = (formData.get("currency") as string) || "INR";
    const rate     = parseFloat((formData.get("rate_at_entry") as string) || "1") || 1;

    const { error } = await supabase.from("income").insert({
      user_id:      user.id,
      source_name:  formData.get("source_name") as string,
      amount:       parseFloat(formData.get("amount") as string),
      currency,
      rate_at_entry: currency === "INR" ? 1 : rate,
      date:         formData.get("date") as string,
      category:     (formData.get("category") as string) || null,
      notes:        (formData.get("notes") as string) || null,
    });
    if (error) return { error: error.message };

    revalidatePath("/accounts");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function deleteIncome(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("income")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/accounts");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── CSV bulk imports ─────────────────────────────────────────────────────────

export async function bulkImportAccounts(rows: Array<Record<string, string>>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    if (!rows.length) return { error: "No rows to import" };

    const { error } = await supabase.from("cash_accounts").insert(
      rows.map(r => ({
        user_id:      user.id,
        name:         r.name || "",
        account_type: r.account_type || "Savings",
        balance:      parseFloat(r.balance) || 0,
        currency:     r.currency || "INR",
        rate_at_entry: 1,
        bank_name:    r.bank_name || null,
        notes:        r.notes || null,
      })),
    );
    if (error) return { error: error.message };
    revalidatePath("/accounts");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function bulkImportIncome(rows: Array<Record<string, string>>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    if (!rows.length) return { error: "No rows to import" };

    const { error } = await supabase.from("income").insert(
      rows.map(r => ({
        user_id:      user.id,
        date:         r.date || "",
        source_name:  r.source_name || "",
        amount:       parseFloat(r.amount) || 0,
        currency:     r.currency || "INR",
        rate_at_entry: 1,
        category:     r.category || null,
        notes:        r.notes || null,
      })),
    );
    if (error) return { error: error.message };
    revalidatePath("/accounts");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}
