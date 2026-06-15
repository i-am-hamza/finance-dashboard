"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  });

  if (error) {
    console.error("signUp error:", error);
    return { error: error.message };
  }

  if (data.user) {
    // Use admin client — regular client has no session when email confirmation is pending
    const admin = createAdminClient();
    const { error: settingsError } = await admin
      .from("user_settings")
      .insert({
        user_id: data.user.id,
        base_currency: "INR",
        display_name: displayName || null,
      });
    if (settingsError) console.error("Failed to seed user_settings:", settingsError.message);
  }

  // No session means Supabase requires email confirmation
  if (!data.session) {
    return { success: "Check your email to confirm your account." };
  }

  // Session is active (email confirmation disabled) — go straight to dashboard
  redirect("/");
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("signIn error:", error);
    return { error: error.message };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) return { error: error.message };

  redirect("/login");
}
