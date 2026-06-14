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
import { addExpense } from "@/lib/actions/spending";
import { todayISO } from "@/lib/utils/date";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD"] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill category if opened from a specific category row */
  defaultCategory?: string;
  /** Existing categories for autocomplete */
  categories: string[];
}

export function ExpenseForm({ open, onOpenChange, defaultCategory, categories }: Props) {
  const router  = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currency, setCurrency] = useState("INR");
  const [category, setCategory] = useState(defaultCategory ?? "");
  const [isCustomCat, setIsCustomCat] = useState(!defaultCategory && !categories.includes(defaultCategory ?? ""));

  const handleCategorySelect = (v: string | null) => {
    if (!v) return;
    if (v === "__new") {
      setIsCustomCat(true);
      setCategory("");
    } else {
      setIsCustomCat(false);
      setCategory(v);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!category.trim()) { toast.error("Category is required"); return; }
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addExpense(null, formData);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Expense added");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  const selectValue = isCustomCat ? "__new" : (category || (categories[0] ?? "__new"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <input type="hidden" name="currency" value={currency} />
          <input type="hidden" name="category" value={category} />

          <div className="space-y-1.5">
            <Label>Category *</Label>
            {categories.length > 0 ? (
              <>
                <Select value={selectValue} onValueChange={handleCategorySelect}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    <SelectItem value="__new">+ New category…</SelectItem>
                  </SelectContent>
                </Select>
                {isCustomCat && (
                  <Input
                    placeholder="Category name"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    autoFocus
                    required
                  />
                )}
              </>
            ) : (
              <Input
                placeholder="e.g. Groceries"
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Amount *</Label>
              <Input
                id="exp-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
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
              <Label htmlFor="exp-rate">Exchange Rate (1 {currency} = ? INR) *</Label>
              <Input
                id="exp-rate"
                name="rate_at_entry"
                type="number"
                step="0.000001"
                min="0.000001"
                required
                placeholder="84.50"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Date *</Label>
              <Input
                id="exp-date"
                name="date"
                type="date"
                required
                defaultValue={todayISO()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-note">Note</Label>
              <Input id="exp-note" name="note" placeholder="Optional" />
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending} size="sm">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Add Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
