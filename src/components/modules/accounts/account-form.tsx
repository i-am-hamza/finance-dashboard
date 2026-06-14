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
import { addAccount, updateAccount } from "@/lib/actions/accounts";
import type { CashAccount } from "@/lib/services/accounts";

const ACCOUNT_TYPES = ["Savings", "Current", "FixedDeposit", "Wallet", "Cash"] as const;
const CURRENCIES    = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD"] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: CashAccount;
}

export function AccountForm({ open, onOpenChange, account }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [accountType, setAccountType] = useState<string>(account?.account_type ?? "Savings");
  const [currency, setCurrency]       = useState<string>(account?.currency ?? "INR");

  const isFD = accountType === "FixedDeposit";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = account
        ? await updateAccount(account.id, null, formData)
        : await addAccount(null, formData);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(account ? "Account updated" : "Account added");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "Add Account"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* hidden inputs for controlled selects */}
          <input type="hidden" name="account_type" value={accountType} />
          <input type="hidden" name="currency" value={currency} />

          <div className="space-y-1.5">
            <Label htmlFor="acc-name">Account Name *</Label>
            <Input
              id="acc-name"
              name="name"
              required
              placeholder="e.g. HDFC Savings"
              defaultValue={account?.name}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Account Type *</Label>
              <Select value={accountType} onValueChange={(v) => v && setAccountType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-bank">Bank / Provider</Label>
              <Input
                id="acc-bank"
                name="bank_name"
                placeholder="HDFC Bank"
                defaultValue={account?.bank_name ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-balance">Balance *</Label>
              <Input
                id="acc-balance"
                name="balance"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                defaultValue={account?.balance ?? ""}
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
              <Label htmlFor="acc-rate">Exchange Rate (1 {currency} = ? INR) *</Label>
              <Input
                id="acc-rate"
                name="rate_at_entry"
                type="number"
                step="0.000001"
                min="0.000001"
                required
                placeholder="e.g. 84.50"
                defaultValue={currency === account?.currency ? (account?.rate_at_entry ?? "") : ""}
              />
            </div>
          )}

          {isFD && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="acc-fd-date">Maturity Date</Label>
                <Input
                  id="acc-fd-date"
                  name="fd_maturity_date"
                  type="date"
                  defaultValue={account?.fd_maturity_date ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acc-fd-rate">Interest Rate %</Label>
                <Input
                  id="acc-fd-rate"
                  name="fd_interest_rate"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="7.5"
                  defaultValue={account?.fd_interest_rate ?? ""}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="acc-notes">Notes</Label>
            <Input
              id="acc-notes"
              name="notes"
              placeholder="Optional note"
              defaultValue={account?.notes ?? ""}
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending} size="sm">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {account ? "Save Changes" : "Add Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
