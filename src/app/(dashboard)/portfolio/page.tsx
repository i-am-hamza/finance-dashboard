import { AlertTriangle } from "lucide-react";
import { getHoldings, computeSummary, computeAllocation, stalenessLabel } from "@/lib/services/portfolio";
import { formatCompact } from "@/lib/utils/currency";
import { AllocationChart } from "@/components/modules/portfolio/allocation-chart";
import { HoldingsTable } from "@/components/modules/portfolio/holdings-table";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const holdings   = await getHoldings();
  const summary    = computeSummary(holdings);
  const allocation = computeAllocation(holdings);
  const staleLabel = stalenessLabel(holdings);

  const pnlPositive = summary.total_pnl >= 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Investment holdings snapshot</p>
      </div>

      {/* Stale price banner */}
      {staleLabel && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-4 py-3">
          <AlertTriangle
            size={16}
            className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
          />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-medium">Some prices are outdated.</span>
            {" "}Last updated: {staleLabel}.{" "}
            <span className="text-amber-700 dark:text-amber-300">
              Update prices manually or re-import from INDmoney.
            </span>
            <span className="block text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Rows with an amber dot have prices older than 7 days.
            </span>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card px-3 py-3">
            <p className="text-xs text-muted-foreground">Total Invested</p>
            <p className="text-lg font-semibold tabular-nums">{formatCompact(summary.total_invested)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3">
            <p className="text-xs text-muted-foreground">Current Value</p>
            <p className="text-lg font-semibold tabular-nums">{formatCompact(summary.current_value)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3">
            <p className="text-xs text-muted-foreground">Total P&amp;L</p>
            <p className={[
              "text-lg font-semibold tabular-nums",
              pnlPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive",
            ].join(" ")}>
              {pnlPositive ? "+" : ""}{formatCompact(summary.total_pnl)}
            </p>
            <p className={[
              "text-[11px]",
              pnlPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive",
            ].join(" ")}>
              {pnlPositive ? "+" : ""}{summary.pnl_pct.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Allocation donut */}
      {allocation.length >= 2 && (
        <AllocationChart allocation={allocation} />
      )}

      {/* Holdings table */}
      <HoldingsTable holdings={holdings} />
    </div>
  );
}
