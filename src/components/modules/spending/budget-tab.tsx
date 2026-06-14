"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ReceiptText, Lock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCompact, formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { deleteBudgetCategory, deleteExpense, bulkImportExpenses } from "@/lib/actions/spending";
import { MonthSelector } from "./month-selector";
import { BudgetChart } from "./budget-chart";
import { BudgetCategoryForm } from "./budget-category-form";
import { ExpenseForm } from "./expense-form";
import { CsvImporter } from "@/components/csv/csv-importer";
import { EXPENSE_FIELDS } from "@/lib/csv/schemas";
import type { BudgetCategoryRow, ExpenseRow, BudgetSummary } from "@/lib/services/spending";

// ─── Category row ─────────────────────────────────────────────────────────────

function CategoryRow({
  row,
  onEdit,
  onAddExpense,
  onDeleteBudget,
  isDeleting,
}: {
  row: BudgetCategoryRow;
  onEdit: () => void;
  onAddExpense: () => void;
  onDeleteBudget: () => void;
  isDeleting: boolean;
}) {
  const hasBudget  = row.budgeted > 0;
  const pct        = hasBudget ? Math.min(100, (row.spent / row.budgeted) * 100) : 0;
  const isOver     = hasBudget && row.spent > row.budgeted;
  const overPct    = hasBudget ? (row.spent / row.budgeted) * 100 : 0;

  return (
    <li className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-foreground">{row.category}</span>
          {isOver && (
            <Badge variant="destructive" className="text-[10px]">Over budget</Badge>
          )}
          {!hasBudget && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">No budget</Badge>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon-sm" variant="ghost" onClick={onAddExpense} aria-label="Add expense">
            <Plus size={13} />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label="Edit budget">
            <Pencil size={13} />
          </Button>
          {row.budget_id && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onDeleteBudget}
              disabled={isDeleting}
              aria-label="Remove budget"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {hasBudget && (
        <div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className={["h-full rounded-full transition-all duration-500", isOver ? "bg-destructive" : "bg-foreground"].join(" ")}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span className={isOver ? "text-destructive font-medium" : ""}>
              {formatCompact(row.spent)} spent
              {isOver && ` (${(overPct - 100).toFixed(0)}% over)`}
            </span>
            <span>{formatCompact(row.budgeted)} budgeted</span>
          </div>
        </div>
      )}

      {/* No-budget row */}
      {!hasBudget && (
        <p className="text-xs text-muted-foreground">
          {formatCompact(row.spent)} spent · no budget set
        </p>
      )}

      {/* Remaining tag */}
      {hasBudget && !isOver && (
        <p className="text-xs text-muted-foreground">
          {formatCompact(row.remaining)} remaining ({(100 - pct).toFixed(0)}%)
        </p>
      )}
    </li>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  month: string;
  categories: BudgetCategoryRow[];
  expenses: ExpenseRow[];
  summary: BudgetSummary;
}

const SOURCE_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  manual:       "outline",
  emi:          "secondary",
  subscription: "default",
};

const SOURCE_LABEL: Record<string, string> = {
  manual:       "Manual",
  emi:          "EMI",
  subscription: "Subscription",
};

export function BudgetTab({ month, categories, expenses, summary }: Props) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();

  const [catFormOpen,   setCatFormOpen]   = useState(false);
  const [editingCat,    setEditingCat]    = useState<BudgetCategoryRow | undefined>();
  const [expFormOpen,   setExpFormOpen]   = useState(false);
  const [expDefCategory, setExpDefCat]   = useState<string | undefined>();
  const [expImportOpen, setExpImportOpen] = useState(false);

  const categoryNames = categories.map(c => c.category);

  const openSetBudget = (cat?: BudgetCategoryRow) => {
    setEditingCat(cat);
    setCatFormOpen(true);
  };

  const openAddExpense = (defaultCat?: string) => {
    setExpDefCat(defaultCat);
    setExpFormOpen(true);
  };

  const handleDeleteBudget = (id: string, cat: string) => {
    if (!window.confirm(`Remove budget for "${cat}"?`)) return;
    startDelete(async () => {
      const result = await deleteBudgetCategory(id);
      if ("error" in result && result.error) toast.error(result.error);
      else { toast.success("Budget removed"); router.refresh(); }
    });
  };

  const handleDeleteExpense = (id: string, isAuto: boolean) => {
    if (isAuto) { toast.error("Auto-entries cannot be deleted here"); return; }
    if (!window.confirm("Delete this expense?")) return;
    startDelete(async () => {
      const result = await deleteExpense(id);
      if ("error" in result && result.error) toast.error(result.error);
      else { toast.success("Expense deleted"); router.refresh(); }
    });
  };

  const hasBudget = categories.some(c => c.budgeted > 0);
  const healthPct = summary.budgeted > 0
    ? Math.max(0, (summary.remaining / summary.budgeted) * 100)
    : null;

  return (
    <>
      <BudgetCategoryForm
        key={`${month}-${editingCat?.category ?? "new"}`}
        open={catFormOpen}
        onOpenChange={setCatFormOpen}
        month={month}
        existing={editingCat}
        suggestedCategories={categoryNames}
      />
      <ExpenseForm
        key={`exp-${month}-${expDefCategory ?? "none"}`}
        open={expFormOpen}
        onOpenChange={setExpFormOpen}
        defaultCategory={expDefCategory}
        categories={categoryNames}
      />
      <CsvImporter
        open={expImportOpen}
        onOpenChange={setExpImportOpen}
        schema={EXPENSE_FIELDS}
        onImport={bulkImportExpenses}
        onSuccess={router.refresh}
        templateFilename="expenses-template.csv"
        title="Import Expenses"
      />

      <div className="space-y-5">
        {/* Toolbar: month nav + actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <MonthSelector month={month} />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setExpImportOpen(true)} className="gap-1.5 rounded-lg">
              <Upload size={14} />
              Import
            </Button>
            <Button size="sm" variant="outline" onClick={() => openAddExpense()} className="gap-1.5 rounded-lg">
              <ReceiptText size={14} />
              Add Expense
            </Button>
            <Button size="sm" onClick={() => openSetBudget()} className="gap-1.5 rounded-lg">
              <Plus size={14} />
              Set Budget
            </Button>
          </div>
        </div>

        {/* Summary row */}
        {hasBudget && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Budgeted",  value: summary.budgeted,  accent: false },
              { label: "Spent",     value: summary.spent,     accent: false },
              { label: "Remaining", value: summary.remaining, accent: true  },
            ].map(({ label, value, accent }) => (
              <div key={label} className="rounded-xl border border-border bg-card px-3 py-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={[
                  "text-lg font-semibold tabular-nums",
                  accent && summary.remaining < 0 ? "text-destructive" : "",
                  accent && summary.remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "",
                ].join(" ")}>
                  {formatCompact(value)}
                </p>
                {label === "Remaining" && healthPct !== null && (
                  <p className="text-[10px] text-muted-foreground">{healthPct.toFixed(0)}% left</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <BudgetChart categories={categories} />

        {/* Category rows */}
        {categories.length === 0 ? (
          <div className="flex h-[140px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">No budget set for this month</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openSetBudget()}>
                <Plus size={14} /> Set Budget
              </Button>
              <Button size="sm" variant="outline" onClick={() => openAddExpense()}>
                <ReceiptText size={14} /> Add Expense
              </Button>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {categories.map(row => (
              <CategoryRow
                key={row.category}
                row={row}
                onEdit={() => openSetBudget(row)}
                onAddExpense={() => openAddExpense(row.category)}
                onDeleteBudget={() => row.budget_id && handleDeleteBudget(row.budget_id, row.category)}
                isDeleting={isDeleting}
              />
            ))}
          </ul>
        )}

        {/* Expense log */}
        {expenses.length > 0 && (
          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              Expense Log
            </h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden sm:table-cell">Note</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map(exp => (
                    <TableRow key={exp.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(exp.date)}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{exp.category}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                        {exp.note ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={SOURCE_BADGE[exp.source] ?? "outline"} className="text-[10px]">
                          {SOURCE_LABEL[exp.source] ?? exp.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatCurrency(exp.amount, exp.currency)}
                        {exp.currency !== "INR" && (
                          <span className="block text-xs font-normal text-muted-foreground">
                            ≈ {formatCompact(exp.amount * exp.rate_at_entry)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {exp.is_auto ? (
                          <Lock
                            size={11}
                            className="text-muted-foreground/50 mx-auto"
                            aria-label="Auto-generated — read only"
                          />
                        ) : (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            disabled={isDeleting}
                            onClick={() => handleDeleteExpense(exp.id, exp.is_auto)}
                            className="text-destructive hover:text-destructive"
                            aria-label="Delete"
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
