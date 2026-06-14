"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { bulkImportSubscriptions } from "@/lib/actions/spending";

const VALID_CYCLES     = ["Weekly", "Monthly", "Quarterly", "Yearly"];
const VALID_STATUSES   = ["Active", "Paused", "Cancelled"];
const VALID_CATEGORIES = ["Streaming", "SaaS", "Finance", "Utilities", "Health", "Other"];

interface ParsedRow {
  service_name:      string;
  amount:            number;
  currency:          string;
  billing_cycle:     string;
  next_renewal_date: string;
  category:          string;
  status:            string;
  notes:             string;
  errors:            string[];
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(",")
    .map(h => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/^["']|["']$/g, ""));

  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
    const cell   = (col: string) => values[headers.indexOf(col)] ?? "";

    const errors: string[] = [];

    const service_name = cell("service_name").trim();
    if (!service_name) errors.push("service_name required");

    const amount = parseFloat(cell("amount"));
    if (isNaN(amount) || amount <= 0) errors.push("amount must be > 0");

    const currency = (cell("currency") || "INR").trim().toUpperCase();

    const rawCycle = cell("billing_cycle");
    const billing_cycle =
      VALID_CYCLES.find(c => c.toLowerCase() === rawCycle.toLowerCase()) ?? "";
    if (!billing_cycle) errors.push(`billing_cycle: ${VALID_CYCLES.join("|")}`);

    const next_renewal_date = cell("next_renewal_date");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next_renewal_date))
      errors.push("next_renewal_date: YYYY-MM-DD");

    const rawCat = cell("category");
    const category =
      VALID_CATEGORIES.find(c => c.toLowerCase() === rawCat.toLowerCase()) ?? "Other";

    const rawStatus = cell("status");
    const status =
      VALID_STATUSES.find(s => s.toLowerCase() === rawStatus.toLowerCase()) ?? "Active";

    const notes = cell("notes").trim();

    return {
      service_name,
      amount: isNaN(amount) ? 0 : amount,
      currency,
      billing_cycle,
      next_renewal_date,
      category,
      status,
      notes,
      errors,
    };
  });
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function SubscriptionCsvImport({ open, onOpenChange }: Props) {
  const router   = useRouter();
  const fileRef  = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isPending, startTransition] = useTransition();

  const validRows   = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setRows(parseCSV(ev.target?.result as string));
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!validRows.length) return;
    startTransition(async () => {
      const result = await bulkImportSubscriptions(
        validRows.map(r => ({
          service_name:      r.service_name,
          amount:            r.amount,
          currency:          r.currency,
          billing_cycle:     r.billing_cycle,
          next_renewal_date: r.next_renewal_date,
          category:          r.category,
          status:            r.status,
          notes:             r.notes || null,
        })),
      );
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Imported ${validRows.length} subscription${validRows.length !== 1 ? "s" : ""}`);
        reset();
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  const reset = () => {
    setRows([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Subscriptions from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Format hint */}
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs space-y-1.5">
            <p className="font-medium text-foreground">Expected columns (comma-separated header row)</p>
            <p className="font-mono text-muted-foreground break-all">
              service_name, amount, currency, billing_cycle, next_renewal_date, category, status, notes
            </p>
            <p className="text-muted-foreground">
              Required: <span className="font-medium text-foreground">service_name, amount, billing_cycle, next_renewal_date</span>
            </p>
            <p className="text-muted-foreground">
              billing_cycle: Weekly / Monthly / Quarterly / Yearly &nbsp;·&nbsp; date format: YYYY-MM-DD
            </p>
          </div>

          {/* File picker */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={14} />
              Choose CSV file
            </Button>
            {rows.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {rows.length} row{rows.length !== 1 ? "s" : ""} parsed
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {/* Parse summary + preview */}
          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-xs">
                {validRows.length > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={12} />
                    {validRows.length} valid
                  </span>
                )}
                {invalidRows.length > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle size={12} />
                    {invalidRows.length} will be skipped
                  </span>
                )}
              </div>

              <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border text-xs">
                <table className="w-full">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                    <tr>
                      {["Service", "Amount", "Cycle", "Renewal", "Status / Error"].map(h => (
                        <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r, i) => (
                      <tr key={i} className={r.errors.length ? "bg-destructive/5" : ""}>
                        <td className="px-2 py-1.5 font-medium text-foreground">
                          {r.service_name || <span className="text-destructive italic">missing</span>}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {r.amount > 0
                            ? `${r.amount} ${r.currency}`
                            : <span className="text-destructive italic">—</span>}
                        </td>
                        <td className="px-2 py-1.5">
                          {r.billing_cycle || <span className="text-destructive italic">—</span>}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {r.next_renewal_date || <span className="text-destructive italic">—</span>}
                        </td>
                        <td className="px-2 py-1.5">
                          {r.errors.length > 0
                            ? <span className="text-destructive">{r.errors[0]}</span>
                            : r.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button
            type="button"
            size="sm"
            disabled={isPending || validRows.length === 0}
            onClick={handleImport}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Import{validRows.length > 0 ? ` (${validRows.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
