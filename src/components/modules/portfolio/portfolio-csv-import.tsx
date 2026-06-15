"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { bulkImportHoldings } from "@/lib/actions/portfolio";
import { ASSET_TYPES, typeLabel } from "@/lib/services/portfolio-constants";
import { todayISO } from "@/lib/utils/date";

// ─── Column aliases: maps various INDmoney header names → our fields ──────────

const COL_MAP: Record<string, string[]> = {
  asset_name:    ["instrument name", "fund name", "name", "stock name", "scheme name", "asset name"],
  asset_type:    ["type", "asset type", "instrument type", "category"],
  buy_price:     ["avg buy price", "average buy price", "buy price", "average nav", "avg nav", "avg cost", "purchase price"],
  current_price: ["ltp", "current price", "current nav", "nav", "market price", "price"],
  quantity:      ["quantity", "units", "qty", "shares"],
  buy_date:      ["buy date", "purchase date", "date of purchase", "date", "first purchase date"],
  currency:      ["currency"],
};

// INDmoney uses names like "EQ", "MF", "FD" etc — map to our enum
const TYPE_NORMALIZE: Record<string, string> = {
  eq:          "Stocks",
  stocks:      "Stocks",
  stock:       "Stocks",
  equity:      "Stocks",
  mf:          "MutualFund",
  "mutual fund": "MutualFund",
  mutualfund:  "MutualFund",
  fd:          "FD",
  "fixed deposit": "FD",
  crypto:      "Crypto",
  cryptocurrency: "Crypto",
  "real estate": "RealEstate",
  realestate:  "RealEstate",
  property:    "RealEstate",
  gold:        "Gold",
  other:       "Other",
};

function normalizeType(raw: string, fallback: string): string {
  const lower = raw.trim().toLowerCase();
  return TYPE_NORMALIZE[lower] ?? fallback;
}

// ─── Flexible date normaliser ─────────────────────────────────────────────────

function normalizeDate(raw: string): string {
  if (!raw) return todayISO();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  // Try JS Date parse as fallback
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  return todayISO();
}

// ─── Parse CSV ────────────────────────────────────────────────────────────────

interface ParsedRow {
  asset_name:    string;
  asset_type:    string;
  buy_price:     number;
  current_price: number;
  quantity:      number;
  currency:      string;
  buy_date:      string;
  errors:        string[];
}

function parseCSV(text: string, defaultType: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
  const headers    = rawHeaders.map(h => h.toLowerCase());

  // Build reverse lookup: our field → CSV column index
  const idx: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(COL_MAP)) {
    for (const alias of aliases) {
      const i = headers.indexOf(alias);
      if (i >= 0) { idx[field] = i; break; }
    }
  }

  const cell = (values: string[], field: string) =>
    (values[idx[field]] ?? "").trim().replace(/^["']|["']$/g, "");

  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(",");
    const errors: string[] = [];

    const asset_name = cell(values, "asset_name");
    if (!asset_name) errors.push("asset_name missing");

    const raw_type   = cell(values, "asset_type");
    const asset_type = raw_type ? normalizeType(raw_type, defaultType) : defaultType;

    const buy_price     = parseFloat(cell(values, "buy_price").replace(/[₹,]/g, ""));
    const current_price = parseFloat(cell(values, "current_price").replace(/[₹,]/g, ""));
    const quantity      = parseFloat(cell(values, "quantity").replace(/,/g, ""));

    if (isNaN(buy_price) || buy_price <= 0)     errors.push("buy_price invalid");
    if (isNaN(current_price) || current_price < 0) errors.push("current_price invalid");
    if (isNaN(quantity) || quantity <= 0)        errors.push("quantity invalid");

    const currency = cell(values, "currency") || "INR";
    const buy_date = normalizeDate(cell(values, "buy_date"));

    return {
      asset_name,
      asset_type,
      buy_price:     isNaN(buy_price) ? 0 : buy_price,
      current_price: isNaN(current_price) ? 0 : current_price,
      quantity:      isNaN(quantity) ? 0 : quantity,
      currency,
      buy_date,
      errors,
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function PortfolioCsvImport({ open, onOpenChange }: Props) {
  const router      = useRouter();
  const fileRef     = useRef<HTMLInputElement>(null);
  const [rows,        setRows]        = useState<ParsedRow[]>([]);
  const [defaultType, setDefaultType] = useState("Stocks");
  const [isPending, startTransition]  = useTransition();

  const validRows   = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setRows(parseCSV(ev.target?.result as string, defaultType));
    reader.readAsText(file);
  };

  const reparse = (type: string) => {
    if (!fileRef.current?.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = ev => setRows(parseCSV(ev.target?.result as string, type));
    reader.readAsText(fileRef.current.files[0]);
  };

  const handleDefaultTypeChange = (v: string | null) => {
    if (!v) return;
    setDefaultType(v);
    reparse(v);
  };

  const handleImport = () => {
    if (!validRows.length) return;
    startTransition(async () => {
      const result = await bulkImportHoldings(validRows);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Imported ${validRows.length} holding${validRows.length !== 1 ? "s" : ""}`);
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
          <DialogTitle>Import Holdings from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Format hint */}
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs space-y-1.5">
            <p className="font-medium text-foreground">INDmoney CSV format</p>
            <p className="text-muted-foreground">
              Compatible with INDmoney stock &amp; mutual fund exports. Expected columns (auto-detected):
            </p>
            <p className="font-mono text-muted-foreground break-all">
              Instrument Name, Avg Buy Price, LTP, Quantity, Buy Date
            </p>
            <p className="text-muted-foreground">
              Also accepts: Fund Name, Average NAV, Current NAV, Units, Date of Purchase, etc.
            </p>
          </div>

          {/* Default type + file picker */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Default type:</span>
              <Select value={defaultType} onValueChange={handleDefaultTypeChange}>
                <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map(t => (
                    <SelectItem key={t} value={t} className="text-xs">{typeLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={14} />
              Choose CSV
            </Button>

            {rows.length > 0 && (
              <span className="text-xs text-muted-foreground">
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

          {/* Parse summary */}
          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-xs">
                {validRows.length > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={12} /> {validRows.length} valid
                  </span>
                )}
                {invalidRows.length > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle size={12} /> {invalidRows.length} will be skipped
                  </span>
                )}
              </div>

              <div className="max-h-[220px] overflow-y-auto rounded-lg border border-border text-xs">
                <table className="w-full">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                    <tr>
                      {["Asset", "Type", "Buy ₹", "Cur ₹", "Qty", "Status"].map(h => (
                        <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r, i) => (
                      <tr key={i} className={r.errors.length ? "bg-destructive/5" : ""}>
                        <td className="px-2 py-1.5 font-medium text-foreground max-w-[120px]">
                          <span className="truncate block">
                            {r.asset_name || <span className="text-destructive italic">—</span>}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground">{typeLabel(r.asset_type)}</td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {r.buy_price > 0 ? r.buy_price.toFixed(2) : <span className="text-destructive">—</span>}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {r.current_price > 0 ? r.current_price.toFixed(2) : "0"}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">{r.quantity || <span className="text-destructive">—</span>}</td>
                        <td className="px-2 py-1.5">
                          {r.errors.length > 0
                            ? <span className="text-destructive">{r.errors[0]}</span>
                            : <span className="text-emerald-600 dark:text-emerald-400">✓</span>}
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
