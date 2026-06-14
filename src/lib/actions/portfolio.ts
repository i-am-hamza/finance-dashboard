"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Add holding ──────────────────────────────────────────────────────────────

export async function addHolding(_prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const currency = (formData.get("currency") as string) || "INR";
    const rate     = parseFloat((formData.get("rate_at_entry") as string) || "1") || 1;

    const { error } = await supabase.from("investments").insert({
      user_id:          user.id,
      asset_name:       (formData.get("asset_name") as string).trim(),
      asset_type:       formData.get("asset_type") as string,
      buy_price:        parseFloat(formData.get("buy_price") as string),
      current_price:    parseFloat(formData.get("current_price") as string),
      quantity:         parseFloat(formData.get("quantity") as string),
      currency,
      rate_at_entry:    currency === "INR" ? 1 : rate,
      buy_date:         formData.get("buy_date") as string,
      price_updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };
    revalidatePath("/portfolio");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Update holding (full edit) ───────────────────────────────────────────────
// price_updated_at is refreshed only when current_price changes.
// The form includes a hidden original_current_price to detect the change.

export async function updateHolding(id: string, _prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const currency    = (formData.get("currency") as string) || "INR";
    const rate        = parseFloat((formData.get("rate_at_entry") as string) || "1") || 1;
    const newPrice    = parseFloat(formData.get("current_price") as string);
    const origPrice   = parseFloat(formData.get("original_current_price") as string);
    const priceChanged = !isNaN(origPrice) && newPrice !== origPrice;

    const { error } = await supabase
      .from("investments")
      .update({
        asset_name:       (formData.get("asset_name") as string).trim(),
        asset_type:       formData.get("asset_type") as string,
        buy_price:        parseFloat(formData.get("buy_price") as string),
        current_price:    newPrice,
        quantity:         parseFloat(formData.get("quantity") as string),
        currency,
        rate_at_entry:    currency === "INR" ? 1 : rate,
        buy_date:         formData.get("buy_date") as string,
        price_updated_at: priceChanged ? new Date().toISOString() : undefined,
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/portfolio");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Quick price update ───────────────────────────────────────────────────────

export async function updateCurrentPrice(id: string, currentPrice: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase
      .from("investments")
      .update({
        current_price:    currentPrice,
        price_updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/portfolio");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Delete holding ───────────────────────────────────────────────────────────

export async function deleteHolding(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase
      .from("investments")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/portfolio");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── CSV bulk import ──────────────────────────────────────────────────────────

interface ImportRow {
  asset_name:    string;
  asset_type:    string;
  buy_price:     number;
  current_price: number;
  quantity:      number;
  currency:      string;
  buy_date:      string;
}

export async function bulkImportHoldings(rows: ImportRow[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    if (!rows.length) return { error: "No rows to import" };

    const now = new Date().toISOString();
    const { error } = await supabase.from("investments").insert(
      rows.map(r => ({
        user_id:          user.id,
        asset_name:       r.asset_name,
        asset_type:       r.asset_type,
        buy_price:        r.buy_price,
        current_price:    r.current_price,
        quantity:         r.quantity,
        currency:         r.currency || "INR",
        rate_at_entry:    1,   // INDmoney exports are INR-denominated
        buy_date:         r.buy_date,
        price_updated_at: now,
      })),
    );
    if (error) return { error: error.message };
    revalidatePath("/portfolio");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}
