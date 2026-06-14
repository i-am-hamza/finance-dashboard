"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatCompact } from "@/lib/utils/currency";
import { recordEmiPayment } from "@/lib/actions/debts";
import { todayISO } from "@/lib/utils/date";
import type { Loan } from "@/lib/services/debts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: Loan | null;
}

export function RecordPaymentForm({ open, onOpenChange, loan }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!loan) return null;

  const monthlyRate = loan.interest_rate / 100 / 12;
  const estimatedInterest = Math.round(loan.outstanding * monthlyRate * 100) / 100;
  const estimatedPrincipal = Math.max(0, Math.round((loan.emi_amount - estimatedInterest) * 100) / 100);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await recordEmiPayment(loan.id, null, formData);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        const remaining = "outstandingAfter" in result
          ? (result as { outstandingAfter: number }).outstandingAfter
          : null;
        if (remaining === 0) {
          toast.success("Payment recorded — loan fully paid off! 🎉");
        } else {
          toast.success(`Payment recorded · Remaining: ${remaining !== null ? formatCompact(remaining) : "—"}`);
        }
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record EMI Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Loan context */}
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm space-y-0.5">
            <p className="font-medium">{loan.lender} — {loan.loan_type}</p>
            <p className="text-xs text-muted-foreground">
              Outstanding: <span className="font-semibold text-foreground">
                {formatCurrency(loan.outstanding, loan.currency)}
              </span>
              {loan.currency !== "INR" && (
                <> (≈ {formatCompact(loan.outstanding * loan.rate_at_entry)})</>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rp-date">Payment Date *</Label>
              <Input
                id="rp-date"
                name="payment_date"
                type="date"
                required
                defaultValue={todayISO()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rp-amount">Amount Paid ({loan.currency}) *</Label>
              <Input
                id="rp-amount"
                name="amount_paid"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={loan.emi_amount}
              />
            </div>
          </div>

          {/* Optional split */}
          <p className="text-xs text-muted-foreground">
            Optional: override auto-calculated P/I split (estimated ₹{formatCompact(estimatedPrincipal)} principal + ₹{formatCompact(estimatedInterest)} interest)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rp-principal">Principal Component</Label>
              <Input
                id="rp-principal"
                name="principal_component"
                type="number"
                step="0.01"
                min="0"
                placeholder={estimatedPrincipal.toString()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rp-interest">Interest Component</Label>
              <Input
                id="rp-interest"
                name="interest_component"
                type="number"
                step="0.01"
                min="0"
                placeholder={estimatedInterest.toString()}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rp-note">Note</Label>
            <Input id="rp-note" name="note" placeholder="Optional note" />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending} size="sm">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
