import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getGoalsSummaryData } from "@/lib/services/goals";
import { formatCompact } from "@/lib/utils/currency";

export async function GoalsSummaryWidget() {
  const data = await getGoalsSummaryData();

  if (!data.hasGoals && data.fireCorpusNeeded === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Goals & FIRE
        </h2>
        <Link
          href="/dashboard/goals"
          className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          View all <ArrowRight size={11} />
        </Link>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        {/* FIRE progress */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] font-medium text-foreground">FIRE Progress</span>
            <span className="text-[12px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {data.firePct}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${data.firePct}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{formatCompact(data.fireCurrentSavings)} saved</span>
            {data.fireYearsLeft !== null ? (
              <span>≈ {data.fireYearsLeft} yrs left</span>
            ) : (
              <span>of {formatCompact(data.fireCorpusNeeded)}</span>
            )}
          </div>
        </div>

        {/* Top goals */}
        {data.topGoals.length > 0 && (
          <div className="space-y-3 border-t border-border pt-3">
            {data.topGoals.map(goal => (
              <div key={goal.name}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="max-w-[70%] truncate text-[11px] text-muted-foreground">
                    {goal.name}
                  </span>
                  <span className="text-[11px] font-medium tabular-nums">
                    {Math.round(goal.pct)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all duration-500"
                    style={{ width: `${goal.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {!data.hasGoals && (
          <p className="text-[11px] text-muted-foreground">
            <Link href="/dashboard/goals" className="text-primary hover:underline">
              Add goals
            </Link>
            {" "}to track your financial milestones.
          </p>
        )}
      </div>
    </section>
  );
}
