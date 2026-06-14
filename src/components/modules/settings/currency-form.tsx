"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { updateBaseCurrency } from "@/lib/actions/settings";

const CURRENCIES = [
  { code: "INR", label: "INR — Indian Rupee (₹)"   },
  { code: "USD", label: "USD — US Dollar ($)"       },
  { code: "EUR", label: "EUR — Euro (€)"            },
  { code: "GBP", label: "GBP — British Pound (£)"  },
  { code: "SGD", label: "SGD — Singapore Dollar"    },
  { code: "AED", label: "AED — UAE Dirham"          },
] as const;

interface Props {
  baseCurrency: string;
}

export function CurrencyForm({ baseCurrency }: Props) {
  const [currency, setCurrency]      = useState(baseCurrency);
  const [isPending, startTransition] = useTransition();

  const isDirty = currency !== baseCurrency;

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateBaseCurrency(currency);
      if ("error" in result && result.error) toast.error(result.error);
      else toast.success("Base currency updated");
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select
          value={currency}
          onValueChange={(v: string | null) => { if (v) setCurrency(v); }}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map(({ code, label }) => (
              <SelectItem key={code} value={code}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isPending}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground max-w-sm">
        All amounts are stored in your base currency. Changing this setting
        does not recalculate historical entries — you would need to re-enter
        exchange rates for existing foreign-currency records.
      </p>
    </div>
  );
}
