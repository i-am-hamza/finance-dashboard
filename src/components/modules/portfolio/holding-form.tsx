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
import { addHolding, updateHolding } from "@/lib/actions/portfolio";
import { todayISO } from "@/lib/utils/date";
import { ASSET_TYPES, typeLabel } from "@/lib/services/portfolio-constants";
import type { HoldingRow } from "@/lib/services/portfolio";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD"] as const;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing?: HoldingRow;
}

export function HoldingForm({ open, onOpenChange, existing }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assetType, setAssetType] = useState(existing?.asset_type ?? "Stocks");
  const [currency,  setCurrency]  = useState(existing?.currency  ?? "INR");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = existing
        ? await updateHolding(existing.id, null, formData)
        : await addHolding(null, formData);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(existing ? "Holding updated" : "Holding added");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Holding" : "Add Holding"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <input type="hidden" name="asset_type"              value={assetType} />
          <input type="hidden" name="currency"                value={currency} />
          {existing && (
            <input type="hidden" name="original_current_price" value={existing.current_price} />
          )}

          {/* Asset name */}
          <div className="space-y-1.5">
            <Label htmlFor="h-name">Asset Name *</Label>
            <Input
              id="h-name"
              name="asset_name"
              required
              placeholder="e.g. RELIANCE, Axis Bluechip Fund"
              defaultValue={existing?.asset_name ?? ""}
            />
          </div>

          {/* Type + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Asset Type</Label>
              <Select value={assetType} onValueChange={(v) => v && setAssetType(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{typeLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="h-rate">Exchange Rate (1 {currency} = ? INR) *</Label>
              <Input
                id="h-rate"
                name="rate_at_entry"
                type="number"
                step="0.000001"
                min="0.000001"
                required
                placeholder="84.50"
                defaultValue={existing && existing.currency !== "INR" ? existing.rate_at_entry : ""}
              />
            </div>
          )}

          {/* Buy price + Current price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="h-buy">Buy Price *</Label>
              <Input
                id="h-buy"
                name="buy_price"
                type="number"
                step="0.000001"
                min="0.000001"
                required
                placeholder="0.00"
                defaultValue={existing?.buy_price ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-cur">Current Price *</Label>
              <Input
                id="h-cur"
                name="current_price"
                type="number"
                step="0.000001"
                min="0"
                required
                placeholder="0.00"
                defaultValue={existing?.current_price ?? ""}
              />
            </div>
          </div>

          {/* Quantity + Buy date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="h-qty">Quantity / Units *</Label>
              <Input
                id="h-qty"
                name="quantity"
                type="number"
                step="0.000001"
                min="0.000001"
                required
                placeholder="10"
                defaultValue={existing?.quantity ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-date">Buy Date *</Label>
              <Input
                id="h-date"
                name="buy_date"
                type="date"
                required
                defaultValue={existing?.buy_date ?? todayISO()}
              />
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending} size="sm">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {existing ? "Save" : "Add Holding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
