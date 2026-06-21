"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function upsertFireSettings(_prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const id     = formData.get("id") as string | null;
    const expRaw = formData.get("monthly_expenses_override") as string;
    const savRaw = formData.get("current_savings_override") as string;
    const ageRaw = formData.get("current_age") as string;
    const retRaw = formData.get("target_retirement_age") as string;

    const fields = {
      monthly_expenses_override: expRaw ? parseFloat(expRaw) : null,
      current_savings_override:  savRaw ? parseFloat(savRaw) : null,
      annual_return_rate:        parseFloat((formData.get("annual_return_rate") as string) || "12") || 12,
      annual_inflation_rate:     parseFloat((formData.get("annual_inflation_rate") as string) || "6") || 6,
      current_age:               ageRaw ? parseInt(ageRaw) : null,
      target_retirement_age:     retRaw ? parseInt(retRaw) : null,
      currency:                  (formData.get("currency") as string) || "INR",
    };

    if (id) {
      const { error } = await supabase.from("fire_settings").update(fields).eq("id", id).eq("user_id", user.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("fire_settings").insert({ user_id: user.id, ...fields });
      if (error) return { error: error.message };
    }

    revalidatePath("/dashboard/goals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function addGoal(_prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const curRaw  = formData.get("current_amount_override") as string;
    const mthRaw  = formData.get("monthly_contribution") as string;
    const dateRaw = formData.get("target_date") as string;

    const { error } = await supabase.from("goals").insert({
      user_id:                user.id,
      name:                   formData.get("name") as string,
      category:               (formData.get("category") as string) || "Other",
      target_amount:          parseFloat(formData.get("target_amount") as string),
      current_amount_override: curRaw ? parseFloat(curRaw) : null,
      monthly_contribution:   mthRaw ? parseFloat(mthRaw) : null,
      target_date:            dateRaw || null,
      currency:               (formData.get("currency") as string) || "INR",
      notes:                  (formData.get("notes") as string) || null,
    });
    if (error) return { error: error.message };

    revalidatePath("/dashboard/goals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function updateGoal(id: string, _prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const curRaw  = formData.get("current_amount_override") as string;
    const mthRaw  = formData.get("monthly_contribution") as string;
    const dateRaw = formData.get("target_date") as string;

    const { error } = await supabase.from("goals").update({
      name:                   formData.get("name") as string,
      category:               (formData.get("category") as string) || "Other",
      target_amount:          parseFloat(formData.get("target_amount") as string),
      current_amount_override: curRaw ? parseFloat(curRaw) : null,
      monthly_contribution:   mthRaw ? parseFloat(mthRaw) : null,
      target_date:            dateRaw || null,
      currency:               (formData.get("currency") as string) || "INR",
      notes:                  (formData.get("notes") as string) || null,
    }).eq("id", id).eq("user_id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/dashboard/goals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function deleteGoal(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/dashboard/goals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function markGoalAchieved(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("goals").update({ status: "achieved" })
      .eq("id", id).eq("user_id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/dashboard/goals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}
