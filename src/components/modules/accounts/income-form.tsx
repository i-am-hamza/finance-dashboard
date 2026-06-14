"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addIncome } from "@/lib/actions/accounts";
import { todayISO } from "@/lib/utils/date";

const CATEGORIES = ["Salary", "Freelance", "Rental", "Dividend", "Business", "Other"] as const;
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD"] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncomeForm({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currency, setCurrency]   = useState<string>("INR");
  const [category, setCategory]   = useState<string>("Salary");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addIncome(null, formData);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Income logged");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Income</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <input type="hidden" name="currency" value={currency} />
          <input type="hidden" name="category" value={category} />

          <div className="space-y-1.5">
            <Label htmlFor="inc-source">Source *</Label>
            <Input
              id="inc-source"
              name="source_name"
              required
              placeholder="e.g. Employer Ltd."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inc-amount">Amount *</Label>
              <Input
                id="inc-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Currency *</Label>
              <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {currency !== "INR" && (
            <div className="space-y-1.5">
              <Label htmlFor="inc-rate">Exchange Rate (1 {currency} = ? INR) *</Label>
              <Input
                id="inc-rate"
                name="rate_at_entry"
                type="number"
                step="0.000001"
                min="0.000001"
                required
                placeholder="e.g. 84.50"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inc-date">Date *</Label>
              <Input
                id="inc-date"
                name="date"
                type="date"
                required
                defaultValue={todayISO()}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inc-notes">Notes</Label>
            <Input
              id="inc-notes"
              name="notes"
              placeholder="Optional note"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending} size="sm">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Log Income
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
