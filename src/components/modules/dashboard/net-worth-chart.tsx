"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCompact } from "@/lib/utils/currency";
import type { ChartPoint } from "@/lib/services/dashboard";

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-sm text-xs">
      <p className="mb-1 text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{formatCompact(payload[0].value)}</p>
    </div>
  );
}

interface Props {
  data: ChartPoint[];
}

export function NetWorthChart({ data }: Props) {
  const hasData = data.some(d => d.value !== 0);

  if (!hasData) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-sm text-muted-foreground text-center px-4">
          Add accounts and investments to see your net worth trend
        </p>
      </div>
    );
  }

  const allPositive = data.every(d => d.value >= 0);
  const gradientId  = "nwGradient";

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--foreground)" stopOpacity={allPositive ? 0.12 : 0.06} />
              <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatCompact(v)}
            width={52}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--foreground)"
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: "var(--foreground)", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
