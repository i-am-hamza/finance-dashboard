"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { addLoan, updateLoan } from "@/lib/actions/debts";
import { todayISO } from "@/lib/utils/date";
import type { Loan } from "@/lib/services/debts";

const LOAN_TYPES  = ["Home", "Car", "Personal", "Education", "CreditCard", "Other"] as const;
const CURRENCIES  = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD"] as const;
const STATUSES    = ["Active", "Paused", "Closed"] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan?: Loan;
}

export function LoanForm({ open, onOpenChange, loan }: Props) {
  const router  = useRouter();
  const [isPending, startTransition] = useTransition();

  const [loanType,  setLoanType]  = useState(loan?.loan_type  ?? "Personal");
  const [currency,  setCurrency]  = useState(loan?.currency   ?? "INR");
  const [status,    setStatus]    = useState(loan?.status     ?? "Active");

  // Track principal to auto-sync outstanding for new loans
  const [principal,    setPrincipal]    = useState(loan?.principal?.toString()    ?? "");
  const [outstanding,  setOutstanding]  = useState(loan?.outstanding?.toString()  ?? "");
  const [principalTouched, setPrincipalTouched] = useState(!!loan);

  const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrincipal(e.target.value);
    if (!principalTouched) setOutstanding(e.target.value);
  };

  const handleOutstandingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOutstanding(e.target.value);
    setPrincipalTouched(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = loan
        ? await updateLoan(loan.id, null, formData)
        : await addLoan(null, formData);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(loan ? "Loan updated" : "Loan added");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{loan ? "Edit Loan" : "Add Loan"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Controlled select hidden inputs */}
          <input type="hidden" name="loan_type" value={loanType} />
          <input type="hidden" name="currency"  value={currency} />
          <input type="hidden" name="status"    value={status} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lf-lender">Lender *</Label>
              <Input
                id="lf-lender"
                name="lender"
                required
                placeholder="HDFC Bank"
                defaultValue={loan?.lender}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Loan Type *</Label>
              <Select value={loanType} onValueChange={(v) => v && setLoanType(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOAN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lf-principal">Principal Amount *</Label>
              <Input
                id="lf-principal"
                name="principal"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="500000"
                value={principal}
                onChange={handlePrincipalChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-outstanding">Current Outstanding *</Label>
              <Input
                id="lf-outstanding"
                name="outstanding"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="auto-fills from principal"
                value={outstanding}
                onChange={handleOutstandingChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lf-rate">Interest % p.a. *</Label>
              <Input
                id="lf-rate"
                name="interest_rate"
                type="number"
                step="0.001"
                min="0"
                required
                placeholder="8.5"
                defaultValue={loan?.interest_rate}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-emi">EMI Amount *</Label>
              <Input
                id="lf-emi"
                name="emi_amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="25000"
                defaultValue={loan?.emi_amount}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-due-day">Due Day *</Label>
              <Input
                id="lf-due-day"
                name="due_day"
                type="number"
                min="1"
                max="31"
                required
                placeholder="5"
                defaultValue={loan?.due_day}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Currency *</Label>
              <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {currency !== "INR" && (
            <div className="space-y-1.5">
              <Label htmlFor="lf-fxrate">Exchange Rate (1 {currency} = ? INR) *</Label>
              <Input
                id="lf-fxrate"
                name="rate_at_entry"
                type="number"
                step="0.000001"
                min="0.000001"
                required
                placeholder="84.50"
                defaultValue={currency === loan?.currency ? (loan?.rate_at_entry ?? "") : ""}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lf-start">Start Date *</Label>
              <Input
                id="lf-start"
                name="start_date"
                type="date"
                required
                defaultValue={loan?.start_date ?? todayISO()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-end">End Date *</Label>
              <Input
                id="lf-end"
                name="end_date"
                type="date"
                required
                defaultValue={loan?.end_date ?? ""}
              />
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending} size="sm">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {loan ? "Save Changes" : "Add Loan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
