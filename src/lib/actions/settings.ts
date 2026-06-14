"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Read ─────────────────────────────────────────────────────────────────────

export interface UserSettings {
  email:        string;
  displayName:  string | null;
  baseCurrency: string;
}

export async function getSettings(): Promise<UserSettings | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("user_settings")
      .select("display_name, base_currency")
      .eq("user_id", user.id)
      .maybeSingle();

    return {
      email:        user.email ?? "",
      displayName:  data?.display_name  ?? null,
      baseCurrency: data?.base_currency ?? "INR",
    };
  } catch {
    return null;
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function updateDisplayName(name: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const trimmed = name.trim();
    if (!trimmed) return { error: "Display name cannot be empty" };

    const { error } = await supabase
      .from("user_settings")
      .update({ display_name: trimmed })
      .eq("user_id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function updateBaseCurrency(currency: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("user_settings")
      .update({ base_currency: currency })
      .eq("user_id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}
