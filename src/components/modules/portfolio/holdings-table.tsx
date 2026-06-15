"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RefreshCw, Upload, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCompact, formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { deleteHolding, bulkImportHoldings } from "@/lib/actions/portfolio";
import { HoldingForm } from "./holding-form";
import { UpdatePriceForm } from "./update-price-form";
import { CsvImporter } from "@/components/csv/csv-importer";
import { HOLDING_FIELDS } from "@/lib/csv/schemas";
import { typeLabel } from "@/lib/services/portfolio-constants";
import type { HoldingRow } from "@/lib/services/portfolio";

const TYPE_COLORS: Record<string, string> = {
  Stocks:     "bg-indigo-500",
  MutualFund: "bg-sky-500",
  FD:         "bg-green-500",
  Crypto:     "bg-amber-500",
  RealEstate: "bg-pink-500",
  Gold:       "bg-yellow-400",
  Other:      "bg-slate-400",
};

type SortKey = "pnl_pct" | "value" | "asset_type";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronUp size={10} className="opacity-25" />;
  return dir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
}

function PnlCell({ value, pct }: { value: number; pct: number }) {
  const positive = value >= 0;
  const cls = positive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-destructive";
  return (
    <div className={cls}>
      <p className="text-sm font-medium tabular-nums">{formatCompact(value)}</p>
      <p className="text-xs tabular-nums">{positive ? "+" : ""}{pct.toFixed(2)}%</p>
    </div>
  );
}

interface Props {
  holdings: HoldingRow[];
}

export function HoldingsTable({ holdings }: Props) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();

  const [holdFormOpen,  setHoldFormOpen]  = useState(false);
  const [editing,       setEditing]       = useState<HoldingRow | undefined>();
  const [priceForm,     setPriceForm]     = useState<HoldingRow | undefined>();
  const [importOpen,    setImportOpen]    = useState(false);
  const [sortKey,       setSortKey]       = useState<SortKey>("value");
  const [sortDir,       setSortDir]       = useState<SortDir>("desc");

  const openAdd  = () => { setEditing(undefined); setHoldFormOpen(true); };
  const openEdit = (h: HoldingRow) => { setEditing(h); setHoldFormOpen(true); };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    startDelete(async () => {
      const result = await deleteHolding(id);
      if ("error" in result && result.error) toast.error(result.error);
      else { toast.success("Holding deleted"); router.refresh(); }
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "asset_type" ? "asc" : "desc"); }
  };

  const sorted = [...holdings].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "pnl_pct")    cmp = a.pnl_pct - b.pnl_pct;
    else if (sortKey === "value") cmp = a.current_value_base - b.current_value_base;
    else cmp = a.asset_type.localeCompare(b.asset_type);
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <>
      <HoldingForm
        key={editing?.id ?? "new"}
        open={holdFormOpen}
        onOpenChange={setHoldFormOpen}
        existing={editing}
      />
      {priceForm && (
        <UpdatePriceForm
          key={`price-${priceForm.id}`}
          open={!!priceForm}
          onOpenChange={(v) => { if (!v) setPriceForm(undefined); }}
          holding={priceForm}
        />
      )}
      <CsvImporter
        open={importOpen}
        onOpenChange={setImportOpen}
        schema={HOLDING_FIELDS}
        onImport={async (rows) =>
          bulkImportHoldings(rows.map(r => ({
            asset_name:    r.asset_name || "",
            asset_type:    r.asset_type || "Other",
            quantity:      parseFloat(r.quantity) || 0,
            buy_price:     parseFloat(r.buy_price) || 0,
            current_price: parseFloat(r.current_price) || 0,
            currency:      r.currency || "INR",
            buy_date:      r.buy_date || "",
          })))
        }
        onSuccess={router.refresh}
        templateFilename="holdings-template.csv"
        title="Import Holdings (INDmoney compatible)"
      />

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Holdings
          </h2>
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
              Add Holding
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {holdings.length === 0 ? (
          <div className="flex h-[160px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">No holdings yet</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                <Upload size={14} /> Import from INDmoney
              </Button>
              <Button size="sm" variant="outline" onClick={openAdd}>
                <Plus size={14} /> Add manually
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead
                    className="hidden sm:table-cell cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => toggleSort("asset_type")}
                  >
                    <span className="flex items-center gap-1">
                      Type <SortIcon active={sortKey === "asset_type"} dir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-right">Qty</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Buy Price</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Cur. Price</TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => toggleSort("value")}
                  >
                    <span className="flex items-center justify-end gap-1">
                      Value <SortIcon active={sortKey === "value"} dir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => toggleSort("pnl_pct")}
                  >
                    <span className="flex items-center justify-end gap-1">
                      P&L <SortIcon active={sortKey === "pnl_pct"} dir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(h => (
                  <TableRow key={h.id}>
                    {/* Asset name + stale dot */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {h.is_stale && (
                          <span
                            className="size-1.5 rounded-full bg-amber-400 shrink-0"
                            title={`Price last updated ${h.stale_days} days ago`}
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{h.asset_name}</p>
                          <p className="text-[11px] text-muted-foreground">{formatDate(h.buy_date)}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Type badge */}
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <span className={`size-1.5 rounded-full ${TYPE_COLORS[h.asset_type] ?? "bg-slate-400"}`} />
                        {typeLabel(h.asset_type)}
                      </Badge>
                    </TableCell>

                    {/* Qty */}
                    <TableCell className="hidden md:table-cell text-right text-xs tabular-nums text-muted-foreground">
                      {h.quantity % 1 === 0 ? h.quantity : h.quantity.toFixed(4)}
                    </TableCell>

                    {/* Buy price */}
                    <TableCell className="hidden lg:table-cell text-right text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(h.buy_price, h.currency)}
                    </TableCell>

                    {/* Current price */}
                    <TableCell className="hidden lg:table-cell text-right text-xs tabular-nums">
                      {formatCurrency(h.current_price, h.currency)}
                    </TableCell>

                    {/* Current value */}
                    <TableCell className="text-right text-sm font-medium tabular-nums">
                      {formatCompact(h.current_value_base)}
                    </TableCell>

                    {/* P&L */}
                    <TableCell className="text-right">
                      <PnlCell value={h.pnl_base} pct={h.pnl_pct} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-0.5 justify-end">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setPriceForm(h)}
                          aria-label="Update price"
                          title="Update current price"
                        >
                          <RefreshCw size={12} />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => openEdit(h)}
                          aria-label="Edit holding"
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={isDeleting}
                          onClick={() => handleDelete(h.id, h.asset_name)}
                          className="text-destructive hover:text-destructive"
                          aria-label="Delete holding"
                        >
                          <Trash2 size={12} />
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
