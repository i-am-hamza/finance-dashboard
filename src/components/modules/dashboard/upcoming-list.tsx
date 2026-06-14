import { formatCompact } from "@/lib/utils/currency";
import { formatShortDate, daysUntil } from "@/lib/utils/date";
import type { UpcomingItem } from "@/lib/services/dashboard";

function DueBadge({ iso }: { iso: string }) {
  const days = daysUntil(iso);
  if (days < 0)  return <span className="text-xs font-medium text-destructive">Overdue</span>;
  if (days === 0) return <span className="text-xs font-medium text-amber-500 dark:text-amber-400">Today</span>;
  if (days === 1) return <span className="text-xs font-medium text-amber-500 dark:text-amber-400">Tomorrow</span>;
  if (days <= 7)  return <span className="text-xs font-medium text-amber-500 dark:text-amber-400">In {days}d</span>;
  return <span className="text-xs text-muted-foreground">{formatShortDate(iso)}</span>;
}

interface Props {
  items: UpcomingItem[];
}

export function UpcomingList({ items }: Props) {
  if (!items.length) {
    return (
      <div className="flex h-[80px] items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-sm text-muted-foreground">Nothing due in the next 30 days</p>
      </div>
    );
  }

  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
      {items.map((item) => {
        const days     = daysUntil(item.dueDate);
        const overdue  = days < 0;
        const urgent   = days >= 0 && days <= 7;
        return (
          <li
            key={`${item.type}-${item.id}`}
            className={[
              "flex items-center justify-between px-4 py-3 transition-colors",
              overdue ? "bg-destructive/5 hover:bg-destructive/10" : "bg-card hover:bg-muted/40",
            ].join(" ")}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={[
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                item.type === "emi"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
              ].join(" ")}>
                {item.type === "emi" ? "EMI" : "Sub"}
              </span>
              <span className={[
                "truncate text-sm",
                overdue ? "text-destructive font-medium" : "text-foreground",
              ].join(" ")}>
                {item.name}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <DueBadge iso={item.dueDate} />
              <span className={[
                "text-sm font-semibold tabular-nums",
                overdue || urgent ? "text-foreground" : "text-foreground",
              ].join(" ")}>
                {formatCompact(item.amount)}
              </span>
            </div>
          </li>
        );
      })}
      {/* Footer total */}
      <li className="flex items-center justify-between px-4 py-2.5 bg-muted/40">
        <span className="text-xs text-muted-foreground font-medium">
          {items.length} item{items.length !== 1 ? "s" : ""} due
        </span>
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {formatCompact(total)} total
        </span>
      </li>
    </ul>
  );
}
