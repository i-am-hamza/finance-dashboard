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
import { addGoal, updateGoal } from "@/lib/actions/goals";
import type { Goal } from "@/lib/services/goals";

const GOAL_CATEGORIES = [
  "Emergency Fund", "Home", "Car", "Travel", "Education",
  "Wedding", "Retirement", "Business", "Other",
] as const;

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"] as const;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing?: Goal;
}

export function GoalForm({ open, onOpenChange, existing }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState(existing?.category ?? "Other");
  const [currency, setCurrency] = useState(existing?.currency ?? "INR");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = existing
        ? await updateGoal(existing.id, null, formData)
        : await addGoal(null, formData);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(existing ? "Goal updated" : "Goal added");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Goal" : "Add Goal"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="currency"  value={currency} />

          <div className="space-y-1.5">
            <Label htmlFor="g-name">Goal Name *</Label>
            <Input
              id="g-name"
              name="name"
              required
              placeholder="e.g. Emergency Fund, Europe Trip"
              defaultValue={existing?.name ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="g-target">Target Amount *</Label>
              <Input
                id="g-target"
                name="target_amount"
                type="number"
                min="1"
                step="1"
                required
                placeholder="500000"
                defaultValue={existing?.target_amount ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-current">Current Amount</Label>
              <Input
                id="g-current"
                name="current_amount_override"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                defaultValue={existing?.current_amount_override ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="g-monthly">Monthly Contribution</Label>
              <Input
                id="g-monthly"
                name="monthly_contribution"
                type="number"
                min="0"
                step="1"
                placeholder="10000"
                defaultValue={existing?.monthly_contribution ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-date">Target Date</Label>
              <Input
                id="g-date"
                name="target_date"
                type="date"
                defaultValue={existing?.target_date ?? ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="g-notes">Notes</Label>
            <textarea
              id="g-notes"
              name="notes"
              rows={2}
              placeholder="Optional notes..."
              defaultValue={existing?.notes ?? ""}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending} size="sm">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {existing ? "Save" : "Add Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
