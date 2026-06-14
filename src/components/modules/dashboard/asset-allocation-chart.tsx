"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCompact } from "@/lib/utils/currency";
import type { AllocationSlice } from "@/lib/services/dashboard";

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
  data: AllocationSlice[];
}

export function AssetAllocationChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-sm text-muted-foreground">No assets yet — add accounts and investments to see allocation</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex items-center gap-4">
      <div className="h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((slice, i) => (
                <Cell key={i} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        {data.map((slice) => {
          const pct = total > 0 ? ((slice.value / total) * 100).toFixed(1) : "0";
          return (
            <div key={slice.name} className="flex items-center gap-2 text-xs">
              <span className="size-2 rounded-full shrink-0" style={{ background: slice.color }} />
              <span className="truncate text-muted-foreground flex-1">{slice.name}</span>
              <span className="font-medium text-foreground tabular-nums">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
