"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCompact } from "@/lib/utils/currency";
import type { IncomeExpensePoint } from "@/lib/services/dashboard";

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-sm text-xs space-y-1">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p) => (
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
  data: IncomeExpensePoint[];
}

export function IncomeExpenseChart({ data }: Props) {
  const hasData = data.some(d => d.income !== 0 || d.expenses !== 0);

  if (!hasData) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-sm text-muted-foreground">No data yet — add income and expenses to see your trend</p>
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
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
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
            formatter={(value) => <span style={{ color: "var(--muted-foreground)", textTransform: "capitalize" }}>{value}</span>}
          />
          <Bar dataKey="income" fill="var(--foreground)" radius={[3, 3, 0, 0]} opacity={0.9} />
          <Bar dataKey="expenses" fill="var(--muted-foreground)" radius={[3, 3, 0, 0]} opacity={0.5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
