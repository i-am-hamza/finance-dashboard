"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CreditCard, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatCompact } from "@/lib/utils/currency";
import { formatDate, getNextEmiDueDate, daysUntil } from "@/lib/utils/date";
import { deleteLoan } from "@/lib/actions/debts";
import { DebtChart } from "./debt-chart";
import { LoanForm } from "./loan-form";
import { RecordPaymentForm } from "./record-payment-form";
import type { Loan } from "@/lib/services/debts";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Active: "default",
  Paused: "secondary",
  Closed: "outline",
};

const TYPE_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Home:       "default",
  Car:        "secondary",
  Personal:   "outline",
  Education:  "outline",
  CreditCard: "destructive",
  Other:      "outline",
};

// ─── Loan card ────────────────────────────────────────────────────────────────

function LoanCard({
  loan,
  onEdit,
  onPay,
  onDelete,
  isDeleting,
}: {
  loan: Loan;
  onEdit: () => void;
  onPay: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const paidAmount  = Math.max(0, loan.principal - loan.outstanding);
  const paidPct     = loan.principal > 0
    ? Math.min(100, (paidAmount / loan.principal) * 100)
    : 0;

  const baseOutstanding = loan.outstanding * loan.rate_at_entry;
  const baseEmi         = loan.emi_amount  * loan.rate_at_entry;
  const showBase        = loan.currency !== "INR";

  const isClosed = loan.status === "Closed";

  // Next due date
  const nextDue    = getNextEmiDueDate(loan.due_day);
  const nextDueISO = nextDue.toISOString().split("T")[0];
  const daysLeft   = daysUntil(nextDueISO);

  return (
    <li className={["flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-opacity", isClosed ? "opacity-60" : ""].join(" ")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-foreground">{loan.lender}</span>
          <Badge variant={TYPE_BADGE[loan.loan_type]   ?? "outline"}>{loan.loan_type}</Badge>
          <Badge variant={STATUS_BADGE[loan.status] ?? "outline"}>{loan.status}</Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isClosed && (
            <Button size="icon-sm" variant="ghost" onClick={onPay} aria-label="Record payment">
              <CreditCard size={13} />
            </Button>
          )}
          <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label="Edit">
            <Pencil size={13} />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Delete"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Paid {paidPct.toFixed(0)}%</span>
          <span>{formatCompact(baseOutstanding)} remaining</span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-500"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatCompact((loan.principal - loan.outstanding) * loan.rate_at_entry)} paid</span>
          <span>{formatCompact(loan.principal * loan.rate_at_entry)} principal</span>
        </div>
      </div>

      {/* Details row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{loan.interest_rate}% p.a.</span>
        <span>
          EMI{" "}
          <span className="text-foreground font-medium">
            {formatCurrency(loan.emi_amount, loan.currency)}
            {showBase && <> (≈ {formatCompact(baseEmi)})</>}
          </span>
        </span>
        <span>Due: {loan.due_day}{["st","nd","rd"][loan.due_day - 1] ?? "th"} of month</span>
        <span>Ends {formatDate(loan.end_date)}</span>
      </div>

      {/* Footer: next due */}
      {!isClosed && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5 border-t border-border">
          <CalendarDays size={12} />
          <span>
            Next EMI:{" "}
            <span className={daysLeft <= 7 ? "text-amber-500 font-medium" : "text-foreground font-medium"}>
              {formatDate(nextDueISO)}
              {daysLeft === 0 && " (today)"}
              {daysLeft === 1 && " (tomorrow)"}
              {daysLeft > 1 && daysLeft <= 7 && ` (in ${daysLeft}d)`}
            </span>
          </span>
        </div>
      )}
    </li>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

interface Props {
  loans: Loan[];
}

export function LoansView({ loans }: Props) {
  const router  = useRouter();
  const [isDeleting, startDelete] = useTransition();

  const [loanFormOpen,    setLoanFormOpen]    = useState(false);
  const [editingLoan,     setEditingLoan]     = useState<Loan | undefined>();
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [payingLoan,      setPayingLoan]      = useState<Loan | null>(null);

  const openAdd  = () => { setEditingLoan(undefined); setLoanFormOpen(true); };
  const openEdit = (l: Loan) => { setEditingLoan(l); setLoanFormOpen(true); };
  const openPay  = (l: Loan) => { setPayingLoan(l); setPaymentFormOpen(true); };

  const handleDelete = (loan: Loan) => {
    if (!window.confirm(`Delete "${loan.lender}" loan? All payment history will be removed.`)) return;
    startDelete(async () => {
      const result = await deleteLoan(loan.id);
      if ("error" in result && result.error) toast.error(result.error);
      else { toast.success("Loan deleted"); router.refresh(); }
    });
  };

  // Sort: Active → Paused → Closed
  const ORDER: Record<string, number> = { Active: 0, Paused: 1, Closed: 2 };
  const sorted = [...loans].sort((a, b) => (ORDER[a.status] ?? 3) - (ORDER[b.status] ?? 3));

  return (
    <>
      <LoanForm
        key={editingLoan?.id ?? "new"}
        open={loanFormOpen}
        onOpenChange={setLoanFormOpen}
        loan={editingLoan}
      />
      <RecordPaymentForm
        key={payingLoan?.id ?? "pay"}
        open={paymentFormOpen}
        onOpenChange={setPaymentFormOpen}
        loan={payingLoan}
      />

      <div className="space-y-5">
        {/* Add Loan button */}
        <div className="flex justify-end">
          <Button size="sm" onClick={openAdd} className="gap-1.5 rounded-lg">
            <Plus size={14} />
            Add Loan
          </Button>
        </div>

        {/* Debt breakdown chart */}
        <DebtChart loans={loans} />

        {/* Loans list */}
        {sorted.length === 0 ? (
          <div className="flex h-[160px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">No loans tracked yet</p>
            <Button size="sm" variant="outline" onClick={openAdd}>
              <Plus size={14} />
              Add your first loan
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {sorted.map(loan => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onEdit={() => openEdit(loan)}
                onPay={() => openPay(loan)}
                onDelete={() => handleDelete(loan)}
                isDeleting={isDeleting}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
