"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, ChevronUp, ChevronDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCompact, formatCurrency } from "@/lib/utils/currency";
import { formatDate, daysUntil } from "@/lib/utils/date";
import { deleteSubscription, bulkImportSubscriptions } from "@/lib/actions/spending";
import { SubscriptionForm } from "./subscription-form";
import { CsvImporter } from "@/components/csv/csv-importer";
import { SUBSCRIPTION_FIELDS } from "@/lib/csv/schemas";
import type { SubscriptionRow } from "@/lib/services/spending";

const CATEGORY_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  Streaming:  "default",
  SaaS:       "secondary",
  Finance:    "secondary",
  Utilities:  "outline",
  Health:     "outline",
  Other:      "outline",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Active:    "default",
  Paused:    "secondary",
  Cancelled: "destructive",
};

const CYCLE_SHORT: Record<string, string> = {
  Weekly:    "/wk",
  Monthly:   "/mo",
  Quarterly: "/qtr",
  Yearly:    "/yr",
};

type SortKey = "renewal" | "cost" | "category";
type SortDir = "asc" | "desc";

function RenewalBadge({ date, status }: { date: string; status: string }) {
  if (status !== "Active") return null;
  const days = daysUntil(date);
  if (days > 7) return null;
  if (days < 0) return (
    <Badge variant="destructive" className="text-[10px] gap-0.5 px-1">
      <Bell size={9} /> Overdue
    </Badge>
  );
  if (days === 0) return (
    <Badge variant="destructive" className="text-[10px] gap-0.5 px-1">
      <Bell size={9} /> Today
    </Badge>
  );
  return (
    <Badge
      variant="outline"
      className="text-[10px] gap-0.5 px-1 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40"
    >
      <Bell size={9} /> {days}d
    </Badge>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronUp size={10} className="opacity-25" />;
  return dir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
}

interface Props {
  subscriptions: SubscriptionRow[];
  monthlyCost: number;
  annualCost: number;
}

export function SubscriptionsTab({ subscriptions, monthlyCost, annualCost }: Props) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();

  const [formOpen,   setFormOpen]   = useState(false);
  const [editing,    setEditing]    = useState<SubscriptionRow | undefined>();
  const [importOpen, setImportOpen] = useState(false);
  const [sortKey,    setSortKey]    = useState<SortKey>("renewal");
  const [sortDir,    setSortDir]    = useState<SortDir>("asc");

  const openAdd  = () => { setEditing(undefined); setFormOpen(true); };
  const openEdit = (sub: SubscriptionRow) => { setEditing(sub); setFormOpen(true); };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    startDelete(async () => {
      const result = await deleteSubscription(id);
      if ("error" in result && result.error) toast.error(result.error);
      else { toast.success("Subscription deleted"); router.refresh(); }
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...subscriptions].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "renewal") cmp = a.next_renewal_date.localeCompare(b.next_renewal_date);
    else if (sortKey === "cost") cmp = a.monthly_base - b.monthly_base;
    else if (sortKey === "category") cmp = (a.category ?? "").localeCompare(b.category ?? "");
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <>
      <SubscriptionForm
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        existing={editing}
      />
      <CsvImporter
        open={importOpen}
        onOpenChange={setImportOpen}
        schema={SUBSCRIPTION_FIELDS}
        onImport={async (rows) =>
          bulkImportSubscriptions(rows.map(r => ({
            service_name:      r.service_name || "",
            amount:            parseFloat(r.amount) || 0,
            currency:          r.currency || "INR",
            billing_cycle:     r.billing_cycle || "Monthly",
            next_renewal_date: r.next_renewal_date || "",
            category:          r.category || "Other",
            status:            r.status || "Active",
            notes:             r.notes || null,
          })))
        }
        onSuccess={router.refresh}
        templateFilename="subscriptions-template.csv"
        title="Import Subscriptions"
      />

      <div className="space-y-5">
        {/* Stats + toolbar */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card px-3 py-3">
              <p className="text-xs text-muted-foreground">Monthly Cost</p>
              <p className="text-lg font-semibold tabular-nums">{formatCompact(monthlyCost)}</p>
              <p className="text-[10px] text-muted-foreground">active only</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-3">
              <p className="text-xs text-muted-foreground">Annual Cost</p>
              <p className="text-lg font-semibold tabular-nums">{formatCompact(annualCost)}</p>
              <p className="text-[10px] text-muted-foreground">active only</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="gap-1.5 rounded-lg"
            >
              <Upload size={14} />
              Import CSV
            </Button>
            <Button size="sm" onClick={openAdd} className="gap-1.5 rounded-lg">
              <Plus size={14} />
              Add
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {subscriptions.length === 0 ? (
          <div className="flex h-[140px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">No subscriptions yet</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                <Upload size={14} /> Import CSV
              </Button>
              <Button size="sm" variant="outline" onClick={openAdd}>
                <Plus size={14} /> Add Subscription
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead
                    className="hidden sm:table-cell cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => toggleSort("category")}
                  >
                    <span className="flex items-center gap-1">
                      Category
                      <SortIcon active={sortKey === "category"} dir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => toggleSort("cost")}
                  >
                    <span className="flex items-center justify-end gap-1">
                      Monthly
                      <SortIcon active={sortKey === "cost"} dir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => toggleSort("renewal")}
                  >
                    <span className="flex items-center gap-1">
                      Next Renewal
                      <SortIcon active={sortKey === "renewal"} dir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(sub => (
                  <TableRow key={sub.id}>
                    {/* Service */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm">{sub.service_name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(sub.amount, sub.currency)}{CYCLE_SHORT[sub.billing_cycle] ?? ""}
                          {sub.billing_cycle !== "Monthly" && (
                            <span className="ml-1">≈ {formatCompact(sub.monthly_base)}/mo</span>
                          )}
                        </p>
                        {sub.notes && (
                          <p className="text-[11px] text-muted-foreground italic truncate max-w-[160px]">
                            {sub.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={CATEGORY_VARIANT[sub.category ?? "Other"] ?? "outline"}
                        className="text-[10px]"
                      >
                        {sub.category ?? "Other"}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={STATUS_VARIANT[sub.status] ?? "outline"} className="text-[10px]">
                        {sub.status}
                      </Badge>
                    </TableCell>

                    {/* Monthly cost */}
                    <TableCell className="text-right tabular-nums text-sm font-medium">
                      {formatCompact(sub.monthly_base)}
                    </TableCell>

                    {/* Next renewal + alert */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {sub.status === "Cancelled" ? "—" : formatDate(sub.next_renewal_date)}
                        </span>
                        {sub.status !== "Cancelled" && (
                          <RenewalBadge date={sub.next_renewal_date} status={sub.status} />
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => openEdit(sub)}
                          aria-label="Edit subscription"
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={isDeleting}
                          onClick={() => handleDelete(sub.id, sub.service_name)}
                          className="text-destructive hover:text-destructive"
                          aria-label="Delete subscription"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
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
