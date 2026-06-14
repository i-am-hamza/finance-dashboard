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
import { addSubscription, updateSubscription } from "@/lib/actions/spending";
import { todayISO } from "@/lib/utils/date";
import type { SubscriptionRow } from "@/lib/services/spending";

const CURRENCIES     = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD"] as const;
const BILLING_CYCLES = ["Weekly", "Monthly", "Quarterly", "Yearly"] as const;
const CATEGORIES     = ["Streaming", "SaaS", "Finance", "Utilities", "Health", "Other"] as const;
const STATUSES       = ["Active", "Paused", "Cancelled"] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: SubscriptionRow;
}

export function SubscriptionForm({ open, onOpenChange, existing }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currency,     setCurrency]     = useState(existing?.currency ?? "INR");
  const [billingCycle, setBillingCycle] = useState(existing?.billing_cycle ?? "Monthly");
  const [category,     setCategory]     = useState(existing?.category ?? "Other");
  const [status,       setStatus]       = useState(existing?.status ?? "Active");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = existing
        ? await updateSubscription(existing.id, null, formData)
        : await addSubscription(null, formData);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(existing ? "Subscription updated" : "Subscription added");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Subscription" : "Add Subscription"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <input type="hidden" name="currency"      value={currency} />
          <input type="hidden" name="billing_cycle" value={billingCycle} />
          <input type="hidden" name="category"      value={category} />
          <input type="hidden" name="status"        value={status} />

          {/* Service name */}
          <div className="space-y-1.5">
            <Label htmlFor="sub-name">Service Name *</Label>
            <Input
              id="sub-name"
              name="service_name"
              required
              placeholder="e.g. Netflix"
              defaultValue={existing?.service_name ?? ""}
            />
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-amount">Amount *</Label>
              <Input
                id="sub-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                defaultValue={existing?.amount ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exchange rate (non-INR) */}
          {currency !== "INR" && (
            <div className="space-y-1.5">
              <Label htmlFor="sub-rate">Exchange Rate (1 {currency} = ? INR) *</Label>
              <Input
                id="sub-rate"
                name="rate_at_entry"
                type="number"
                step="0.000001"
                min="0.000001"
                required
                placeholder="84.50"
                defaultValue={existing?.rate_at_entry !== 1 ? existing?.rate_at_entry : ""}
              />
            </div>
          )}

          {/* Billing cycle + Next renewal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Billing Cycle</Label>
              <Select value={billingCycle} onValueChange={(v) => v && setBillingCycle(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-renewal">Next Renewal *</Label>
              <Input
                id="sub-renewal"
                name="next_renewal_date"
                type="date"
                required
                defaultValue={existing?.next_renewal_date ?? todayISO()}
              />
            </div>
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="sub-notes">Notes</Label>
            <Input
              id="sub-notes"
              name="notes"
              placeholder="Optional"
              defaultValue={existing?.notes ?? ""}
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending} size="sm">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {existing ? "Save" : "Add Subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
