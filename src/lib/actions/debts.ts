"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Loan mutations ───────────────────────────────────────────────────────────

export async function addLoan(_prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const currency  = (formData.get("currency") as string) || "INR";
    const rate      = parseFloat((formData.get("rate_at_entry") as string) || "1") || 1;
    const principal = parseFloat(formData.get("principal") as string) || 0;
    const outRaw    = formData.get("outstanding") as string;
    const outstanding = outRaw ? parseFloat(outRaw) : principal;

    const { error } = await supabase.from("loans").insert({
      user_id:       user.id,
      lender:        formData.get("lender") as string,
      loan_type:     formData.get("loan_type") as string,
      principal,
      outstanding,
      interest_rate: parseFloat(formData.get("interest_rate") as string) || 0,
      emi_amount:    parseFloat(formData.get("emi_amount") as string) || 0,
      currency,
      rate_at_entry: currency === "INR" ? 1 : rate,
      due_day:       parseInt(formData.get("due_day") as string, 10) || 1,
      start_date:    formData.get("start_date") as string,
      end_date:      formData.get("end_date") as string,
      status:        (formData.get("status") as string) || "Active",
    });
    if (error) return { error: error.message };

    revalidatePath("/debts");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function updateLoan(id: string, _prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const currency    = (formData.get("currency") as string) || "INR";
    const rate        = parseFloat((formData.get("rate_at_entry") as string) || "1") || 1;
    const principal   = parseFloat(formData.get("principal") as string) || 0;
    const outRaw      = formData.get("outstanding") as string;
    const outstanding = outRaw ? parseFloat(outRaw) : principal;

    const { error } = await supabase
      .from("loans")
      .update({
        lender:        formData.get("lender") as string,
        loan_type:     formData.get("loan_type") as string,
        principal,
        outstanding,
        interest_rate: parseFloat(formData.get("interest_rate") as string) || 0,
        emi_amount:    parseFloat(formData.get("emi_amount") as string) || 0,
        currency,
        rate_at_entry: currency === "INR" ? 1 : rate,
        due_day:       parseInt(formData.get("due_day") as string, 10) || 1,
        start_date:    formData.get("start_date") as string,
        end_date:      formData.get("end_date") as string,
        status:        formData.get("status") as string,
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/debts");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function deleteLoan(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("loans")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/debts");
    return { success: true };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── EMI payment recording ────────────────────────────────────────────────────

export async function recordEmiPayment(loanId: string, _prev: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Fetch current loan state
    const { data: loan, error: loanFetchErr } = await supabase
      .from("loans")
      .select("lender, loan_type, outstanding, interest_rate, currency, rate_at_entry, status")
      .eq("id", loanId)
      .eq("user_id", user.id)
      .single();
    if (loanFetchErr || !loan) return { error: "Loan not found" };

    const paymentDate = formData.get("payment_date") as string;
    const amountPaid  = parseFloat(formData.get("amount_paid") as string);
    const noteRaw     = (formData.get("note") as string) || null;

    // Derive principal / interest split
    const principalRaw = formData.get("principal_component") as string;
    const interestRaw  = formData.get("interest_component") as string;
    let principalComponent: number;
    let interestComponent: number;

    if (principalRaw && interestRaw) {
      principalComponent = parseFloat(principalRaw);
      interestComponent  = parseFloat(interestRaw);
    } else {
      const monthlyRate  = loan.interest_rate / 100 / 12;
      interestComponent  = Math.round(loan.outstanding * monthlyRate * 100) / 100;
      principalComponent = Math.max(0, Math.round((amountPaid - interestComponent) * 100) / 100);
    }

    const outstandingAfter = Math.max(0, Math.round((loan.outstanding - principalComponent) * 100) / 100);

    // Insert emi_payments row
    const { data: payment, error: payErr } = await supabase
      .from("emi_payments")
      .insert({
        user_id:             user.id,
        loan_id:             loanId,
        payment_date:        paymentDate,
        amount_paid:         amountPaid,
        currency:            loan.currency,
        rate_at_entry:       loan.rate_at_entry,
        principal_component: principalComponent,
        interest_component:  interestComponent,
        outstanding_after:   outstandingAfter,
      })
      .select("id")
      .single();
    if (payErr || !payment) return { error: payErr?.message ?? "Failed to record payment" };

    // Update loan outstanding (and close if fully paid)
    const { error: updateErr } = await supabase
      .from("loans")
      .update({
        outstanding: outstandingAfter,
        status:      outstandingAfter === 0 ? "Closed" : loan.status,
      })
      .eq("id", loanId)
      .eq("user_id", user.id);
    if (updateErr) return { error: updateErr.message };

    // Auto-create read-only budget_expenses entry (best-effort — EMI payment still
    // succeeds even if this insert fails, but we capture the outcome for logging).
    const { error: expErr } = await supabase.from("budget_expenses").insert({
      user_id:      user.id,
      date:         paymentDate,
      amount:       amountPaid,
      currency:     loan.currency,
      rate_at_entry: loan.rate_at_entry,
      category:     "EMI",
      note:         `${loan.lender} — ${loan.loan_type}${noteRaw ? ` (${noteRaw})` : ""}`,
      source:       "emi",
      source_id:    payment.id,
      is_auto:      true,
    });

    revalidatePath("/debts");
    revalidatePath("/spending"); // bust spending cache so EMI appears in budget immediately
    return { success: true, outstandingAfter, budgetEntryFailed: !!expErr };
  } catch {
    return { error: "Something went wrong" };
  }
}
