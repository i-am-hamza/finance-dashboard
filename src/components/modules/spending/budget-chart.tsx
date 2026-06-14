"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, Cell, ResponsiveContainer,
} from "recharts";
import { formatCompact } from "@/lib/utils/currency";
import type { BudgetCategoryRow } from "@/lib/services/spending";

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-sm text-xs space-y-1">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold text-foreground">{formatCompact(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  categories: BudgetCategoryRow[];
}

export function BudgetChart({ categories }: Props) {
  // Show only categories with budget or spend; cap at 8 to avoid clutter
  const data = categories
    .filter(c => c.budgeted > 0 || c.spent > 0)
    .slice(0, 8)
    .map(c => ({
      name:     c.category.length > 10 ? c.category.slice(0, 10) + "…" : c.category,
      fullName: c.category,
      budgeted: Math.round(c.budgeted),
      spent:    Math.round(c.spent),
      over:     c.spent > c.budgeted && c.budgeted > 0,
    }));

  if (!data.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Budget vs Actual
      </p>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
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
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
              formatter={(value) => (
                <span style={{ color: "var(--muted-foreground)", textTransform: "capitalize" }}>
                  {value}
                </span>
              )}
            />
            <Bar dataKey="budgeted" fill="var(--muted-foreground)" opacity={0.35} radius={[3, 3, 0, 0]} name="budget" />
            <Bar dataKey="spent" radius={[3, 3, 0, 0]} name="spent">
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.over ? "var(--color-destructive, #ef4444)" : "var(--foreground)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
