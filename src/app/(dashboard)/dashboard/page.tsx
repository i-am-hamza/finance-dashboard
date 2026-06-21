import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { NetWorthChart } from "@/components/modules/dashboard/net-worth-chart";
import { IncomeExpenseChart } from "@/components/modules/dashboard/income-expense-chart";
import { AssetAllocationChart } from "@/components/modules/dashboard/asset-allocation-chart";
import { UpcomingList } from "@/components/modules/dashboard/upcoming-list";
import { GoalsSummaryWidget } from "@/components/modules/goals/goals-summary-widget";
import {
  getNetWorthData,
  getMonthlySummary,
  getNetWorthHistory,
  getIncomeExpenseTrend,
  getAssetAllocation,
  getUpcomingItems,
} from "@/lib/services/dashboard";
import { formatCompact } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [nw, summary, nwHistory, ietrend, allocation, upcoming] = await Promise.all([
    getNetWorthData(),
    getMonthlySummary(),
    getNetWorthHistory(),
    getIncomeExpenseTrend(),
    getAssetAllocation(),
    getUpcomingItems(),
  ]);

  const budgetHealthDisplay = summary.budgetHealthPct !== null
    ? `${Math.round(summary.budgetHealthPct)}% left`
    : "—";

  const savingsDisplay = summary.savingsRate !== null
    ? `${summary.savingsRate.toFixed(1)}%`
    : "—";

  const savingsSub = summary.savingsRate !== null
    ? summary.savingsRate >= 0 ? "of income saved this month" : "spending over income"
    : undefined;

  return (
    <div>
      <PageHeader title="Home" subtitle="Your financial snapshot" />

      <div className="space-y-6 px-4 pb-8 md:px-6">

        {/* ── Net Worth hero ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <StatCard
            label="Net Worth"
            value={formatCompact(nw.current)}
            delta={
              nw.deltaPercent !== null
                ? { value: nw.deltaPercent, label: "vs last month (estimated)" }
                : undefined
            }
            sub={`Cash ${formatCompact(nw.cash)}  ·  Investments ${formatCompact(nw.investments)}  ·  Debt −${formatCompact(nw.debt)}`}
            flat
          />
          <NetWorthChart data={nwHistory} />
        </div>

        {/* ── Summary cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Monthly Income"
            value={formatCompact(summary.income)}
          />
          <StatCard
            label="Monthly Expenses"
            value={formatCompact(summary.expenses)}
          />
          <StatCard
            label="Savings Rate"
            value={savingsDisplay}
            sub={savingsSub}
            className="col-span-2 sm:col-span-1"
          />
          <StatCard
            label="EMI Burden"
            value={`${formatCompact(summary.emiMonthly)}/mo`}
          />
          <StatCard
            label="Subscriptions"
            value={`${formatCompact(summary.subscriptionMonthly)}/mo`}
          />
          <StatCard
            label="Budget Health"
            value={budgetHealthDisplay}
            className="col-span-2 sm:col-span-1"
          />
        </div>

        {/* ── Income vs Expenses ────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Income vs Expenses
          </h2>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <IncomeExpenseChart data={ietrend} />
          </div>
        </section>

        {/* ── Asset Allocation ──────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Asset Allocation
          </h2>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <AssetAllocationChart data={allocation} />
          </div>
        </section>

        {/* ── Upcoming 30 days ──────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming (Next 30 Days)
          </h2>
          <UpcomingList items={upcoming} />
        </section>

        {/* ── Goals & FIRE ──────────────────────────────────────────────── */}
        <GoalsSummaryWidget />

      </div>
    </div>
  );
}
