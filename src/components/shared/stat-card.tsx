import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DeltaProps {
  value: number;       // percentage, e.g. 12.4 or -3.2
  label?: string;      // e.g. "vs last month"
}

function DeltaChip({ value, label }: DeltaProps) {
  const positive = value > 0;
  const neutral  = value === 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
        neutral  && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
        positive && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
        !positive && !neutral && "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
      )}
      title={label}
    >
      {neutral  && <Minus    size={10} strokeWidth={2.5} />}
      {positive && <TrendingUp   size={10} strokeWidth={2.5} />}
      {!positive && !neutral && <TrendingDown size={10} strokeWidth={2.5} />}
      {value > 0 ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string;              // pre-formatted, e.g. "₹83,500" or "46%"
  delta?: DeltaProps;
  sub?: string;               // optional muted sub-line, e.g. "as of Jun 2026"
  className?: string;
  /** Render as a plain div instead of a raised card */
  flat?: boolean;
}

export function StatCard({
  label,
  value,
  delta,
  sub,
  className,
  flat = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl p-5",
        !flat && "bg-card shadow-sm border border-border",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground leading-none">
          {label}
        </p>
        {delta !== undefined && <DeltaChip {...delta} />}
      </div>

      <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums leading-none">
        {value}
      </p>

      {sub && (
        <p className="text-[11px] text-muted-foreground/70 leading-none">
          {sub}
        </p>
      )}
    </div>
  );
}
