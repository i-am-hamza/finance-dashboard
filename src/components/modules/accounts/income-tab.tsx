"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCompact, formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { deleteIncome, bulkImportIncome } from "@/lib/actions/accounts";
import { IncomeChart } from "./income-chart";
import { IncomeForm } from "./income-form";
import { CsvImporter } from "@/components/csv/csv-importer";
import { INCOME_FIELDS } from "@/lib/csv/schemas";
import type { IncomeEntry, IncomeChartPoint } from "@/lib/services/accounts";

const CATEGORY_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  Salary:    "default",
  Freelance: "secondary",
  Rental:    "outline",
  Dividend:  "outline",
  Business:  "secondary",
  Other:     "outline",
};

interface Props {
  entries: IncomeEntry[];
  chartData: IncomeChartPoint[];
  thisMonth: number;
}

export function IncomeTab({ entries, chartData, thisMonth }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen,   setFormOpen]    = useState(false);
  const [importOpen, setImportOpen]  = useState(false);

  const handleDelete = (entry: IncomeEntry) => {
    if (!window.confirm(`Delete income from "${entry.source_name}"?`)) return;
    startTransition(async () => {
      const result = await deleteIncome(entry.id);
      if ("error" in result && result.error) toast.error(result.error);
      else { toast.success("Income entry deleted"); router.refresh(); }
    });
  };

  return (
    <>
      <IncomeForm open={formOpen} onOpenChange={setFormOpen} />
      <CsvImporter
        open={importOpen}
        onOpenChange={setImportOpen}
        schema={INCOME_FIELDS}
        onImport={bulkImportIncome}
        onSuccess={router.refresh}
        templateFilename="income-template.csv"
        title="Import Income"
      />

      <div className="space-y-5">
        {/* Stat header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">This Month</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{formatCompact(thisMonth)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)} className="gap-1.5 rounded-lg">
              <Upload size={14} />
              Import CSV
            </Button>
            <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5 rounded-lg">
              <Plus size={14} />
              Log Income
            </Button>
          </div>
        </div>

        {/* 6-month chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Last 6 Months
          </p>
          <IncomeChart data={chartData} />
        </div>

        {/* Income log */}
        {entries.length === 0 ? (
          <div className="flex h-[120px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">No income logged yet</p>
            <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
              <Plus size={14} />
              Log your first income
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(entry.date)}
                    </TableCell>
                    <TableCell className="font-medium">{entry.source_name}</TableCell>
                    <TableCell>
                      {entry.category ? (
                        <Badge variant={CATEGORY_VARIANT[entry.category] ?? "outline"}>
                          {entry.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatCurrency(entry.amount, entry.currency)}
                      {entry.currency !== "INR" && (
                        <span className="block text-xs text-muted-foreground font-normal">
                          ≈ {formatCompact(entry.amount * entry.rate_at_entry)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => handleDelete(entry)}
                        className="text-destructive hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
