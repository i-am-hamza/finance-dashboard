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
import { updateCurrentPrice } from "@/lib/actions/portfolio";
import type { HoldingRow } from "@/lib/services/portfolio";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  holding: HoldingRow;
}

export function UpdatePriceForm({ open, onOpenChange, holding }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const price = parseFloat(
      (new FormData(e.currentTarget).get("current_price") as string) ?? ""
    );
    if (isNaN(price) || price < 0) { toast.error("Invalid price"); return; }
    startTransition(async () => {
      const result = await updateCurrentPrice(holding.id, price);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Price updated");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Update Price</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">
          {holding.asset_name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="up-price">Current Price ({holding.currency}) *</Label>
            <Input
              id="up-price"
              name="current_price"
              type="number"
              step="0.000001"
              min="0"
              required
              defaultValue={holding.current_price}
              autoFocus
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending} size="sm">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
