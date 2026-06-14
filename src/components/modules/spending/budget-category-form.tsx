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
import { setBudgetCategory } from "@/lib/actions/spending";
import type { BudgetCategoryRow } from "@/lib/services/spending";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD"] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  existing?: BudgetCategoryRow; // undefined → new category
  suggestedCategories: string[];
}

export function BudgetCategoryForm({
  open, onOpenChange, month, existing, suggestedCategories,
}: Props) {
  const router  = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currency, setCurrency] = useState("INR");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await setBudgetCategory(null, formData);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(existing ? "Budget updated" : "Budget category set");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Budget" : "Set Budget"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <input type="hidden" name="month"    value={month} />
          <input type="hidden" name="currency" value={currency} />

          <div className="space-y-1.5">
            <Label htmlFor="bc-category">Category *</Label>
            {existing ? (
              <>
                <input type="hidden" name="category" value={existing.category} />
                <p className="h-8 flex items-center px-2.5 rounded-lg border border-input bg-muted/50 text-sm text-foreground">
                  {existing.category}
                </p>
              </>
            ) : (
              <>
                <Input
                  id="bc-category"
                  name="category"
                  required
                  list="bc-category-list"
                  placeholder="e.g. Groceries"
                  autoComplete="off"
                />
                <datalist id="bc-category-list">
                  {suggestedCategories.map(c => <option key={c} value={c} />)}
                </datalist>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bc-amount">Budget Amount *</Label>
              <Input
                id="bc-amount"
                name="budgeted_amount"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="10000"
                defaultValue={existing ? Math.round(existing.budgeted) : ""}
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

          {currency !== "INR" && (
            <div className="space-y-1.5">
              <Label htmlFor="bc-rate">Exchange Rate (1 {currency} = ? INR) *</Label>
              <Input
                id="bc-rate"
                name="rate_at_entry"
                type="number"
                step="0.000001"
                min="0.000001"
                required
                placeholder="84.50"
              />
            </div>
          )}

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending} size="sm">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {existing ? "Save" : "Set Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
