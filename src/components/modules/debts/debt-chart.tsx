"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCompact } from "@/lib/utils/currency";
import type { Loan } from "@/lib/services/debts";

const LOAN_TYPE_COLORS: Record<string, string> = {
  Home:       "#2563eb",
  Car:        "#3b82f6",
  Personal:   "#f59e0b",
  Education:  "#10b981",
  CreditCard: "#ef4444",
  Other:      "#6b7280",
};

function ChartTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-sm text-xs">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: item.payload.color }} />
        <span className="text-muted-foreground">{item.name}:</span>
        <span className="font-semibold text-foreground">{formatCompact(item.value)}</span>
      </div>
    </div>
  );
}

interface Props {
  loans: Loan[];
}

export function DebtChart({ loans }: Props) {
  const activeLoans = loans.filter(l => l.status !== "Closed" && l.outstanding > 0);

  if (!activeLoans.length) return null;

  const byType: Record<string, number> = {};
  for (const l of activeLoans) {
    byType[l.loan_type] = (byType[l.loan_type] ?? 0) + l.outstanding * l.rate_at_entry;
  }

  const slices = Object.entries(byType)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
      color: LOAN_TYPE_COLORS[name] ?? "#6b7280",
    }));

  if (slices.length < 2) return null; // single slice not worth a donut

  const total = slices.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Debt Breakdown
      </p>
      <div className="flex items-center gap-4">
        <div className="h-[160px] w-[160px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={72}
                dataKey="value"
                strokeWidth={0}
              >
                {slices.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {slices.map(s => (
            <div key={s.name} className="flex items-center gap-2 text-xs">
              <span className="size-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="truncate text-muted-foreground flex-1">{s.name}</span>
              <span className="font-medium text-foreground tabular-nums">
                {((s.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
