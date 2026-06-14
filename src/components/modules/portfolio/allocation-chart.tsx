"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCompact } from "@/lib/utils/currency";
import type { AllocationSlice } from "@/lib/services/portfolio";

const TYPE_COLORS: Record<string, string> = {
  Stocks:     "#4f46e5",
  MutualFund: "#0ea5e9",
  FD:         "#22c55e",
  Crypto:     "#f59e0b",
  RealEstate: "#ec4899",
  Gold:       "#eab308",
  Other:      "#94a3b8",
};

function ChartTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: AllocationSlice }[];
}) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-sm text-xs space-y-1">
      <p className="font-medium text-foreground">{slice.label}</p>
      <p className="text-muted-foreground">{formatCompact(slice.value)}</p>
      <p className="text-muted-foreground">{slice.pct.toFixed(1)}% of portfolio</p>
    </div>
  );
}

interface Props {
  allocation: AllocationSlice[];
}

export function AllocationChart({ allocation }: Props) {
  if (!allocation.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Allocation by Asset Type
      </p>
      <div className="flex items-center gap-6 flex-wrap">
        {/* Donut */}
        <div className="h-[160px] w-[160px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocation}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={2}
                strokeWidth={0}
              >
                {allocation.map((slice) => (
                  <Cell
                    key={slice.type}
                    fill={TYPE_COLORS[slice.type] ?? TYPE_COLORS.Other}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <ul className="space-y-2 flex-1 min-w-0">
          {allocation.map(slice => (
            <li key={slice.type} className="flex items-center gap-2 min-w-0">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ background: TYPE_COLORS[slice.type] ?? TYPE_COLORS.Other }}
              />
              <span className="text-xs text-muted-foreground truncate flex-1">
                {slice.label}
              </span>
              <span className="text-xs font-medium tabular-nums shrink-0">
                {slice.pct.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {formatCompact(slice.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
