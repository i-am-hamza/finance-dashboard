"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatCompact } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type { EmiPaymentRow, EmiTrendPoint } from "@/lib/services/debts";

const TYPE_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Home: "default", Car: "secondary", Personal: "outline",
  Education: "outline", CreditCard: "destructive", Other: "outline",
};

// ─── Trend chart ─────────────────────────────────────────────────────────────

function TrendChart({ data }: { data: EmiTrendPoint[] }) {
  const hasData = data.some(d => d.total > 0);
  if (!hasData) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        EMI Outflow — Last 6 Months
      </p>
      <div className="h-[140px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCompact(v)}
              width={48}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-sm text-xs">
                    <p className="text-muted-foreground mb-1">{label}</p>
                    <p className="font-semibold text-foreground">{formatCompact(payload[0].value as number)}</p>
                  </div>
                );
              }}
              cursor={{ fill: "var(--muted)", opacity: 0.15 }}
            />
            <Bar dataKey="total" fill="var(--foreground)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Payment history table ────────────────────────────────────────────────────

interface Props {
  payments: EmiPaymentRow[];
  trendData: EmiTrendPoint[];
  loanOptions: { id: string; label: string }[];
}

export function EmiHistory({ payments, trendData, loanOptions }: Props) {
  const [filterLoan, setFilterLoan] = useState<string>("all");

  const filtered = filterLoan === "all"
    ? payments
    : payments.filter(p => p.loan_id === filterLoan);

  const totalPaid = filtered.reduce((s, p) => s + p.amount_paid * p.rate_at_entry, 0);

  return (
    <div className="space-y-5">
      {/* Trend chart */}
      <TrendChart data={trendData} />

      {/* Filter + summary row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {filtered.length} payment{filtered.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xl font-semibold tabular-nums">
            {formatCompact(totalPaid)}
            <span className="text-sm font-normal text-muted-foreground ml-1">total paid</span>
          </p>
        </div>

        {loanOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter:</span>
            <input type="hidden" value={filterLoan} />
            <Select value={filterLoan} onValueChange={(v) => v && setFilterLoan(v)}>
              <SelectTrigger className="h-7 text-xs rounded-lg" style={{ width: 180 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Loans</SelectItem>
                {loanOptions.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex h-[120px] items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No EMI payments recorded yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Loan</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Principal</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Interest</TableHead>
                <TableHead className="text-right hidden md:table-cell">Outstanding After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(p.payment_date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium">{p.lender}</span>
                      <Badge variant={TYPE_BADGE[p.loan_type] ?? "outline"} className="text-[10px]">
                        {p.loan_type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {formatCurrency(p.amount_paid, p.currency)}
                    {p.currency !== "INR" && (
                      <span className="block text-xs text-muted-foreground font-normal">
                        ≈ {formatCompact(p.amount_paid * p.rate_at_entry)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">
                    {p.principal_component != null
                      ? formatCurrency(p.principal_component, p.currency)
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">
                    {p.interest_component != null
                      ? formatCurrency(p.interest_component, p.currency)
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm hidden md:table-cell text-muted-foreground">
                    {formatCurrency(p.outstanding_after, p.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
