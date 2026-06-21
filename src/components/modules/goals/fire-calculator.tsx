"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertFireSettings } from "@/lib/actions/goals";
import { formatCompact } from "@/lib/utils/currency";
import type { FireSettings, GoalsAutoData } from "@/lib/services/goals";

interface FireVariant {
  label:          string;
  color:          string;
  expMultiplier:  number;
  withdrawalRate: number;
}

const VARIANTS: FireVariant[] = [
  { label: "Lean FIRE",    color: "#3b82f6", expMultiplier: 0.70, withdrawalRate: 0.04 },
  { label: "Regular FIRE", color: "#10b981", expMultiplier: 1.00, withdrawalRate: 0.04 },
  { label: "Fat FIRE",     color: "#f59e0b", expMultiplier: 1.50, withdrawalRate: 0.03 },
];

interface Props {
  settings: FireSettings;
  autoData: GoalsAutoData;
}

export function FireCalculator({ settings, autoData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [monthlyExp, setMonthlyExp] = useState(settings.monthly_expenses_override?.toString() ?? "");
  const [curSavings, setCurSavings] = useState(settings.current_savings_override?.toString() ?? "");
  const [returnRate, setReturnRate] = useState(settings.annual_return_rate.toString());
  const [inflRate,   setInflRate]   = useState(settings.annual_inflation_rate.toString());
  const [curAge,     setCurAge]     = useState(settings.current_age?.toString() ?? "");

  const effectiveExp     = parseFloat(monthlyExp) || autoData.avgMonthlyExpenses;
  const effectiveSavings = parseFloat(curSavings) || autoData.totalSavings;
  const effectiveReturn  = parseFloat(returnRate) || 12;
  const effectiveInfl    = parseFloat(inflRate)   || 6;
  const monthlySavings   = autoData.avgMonthlyIncome - effectiveExp;
  const savingsRate      = autoData.avgMonthlyIncome > 0
    ? Math.round((monthlySavings / autoData.avgMonthlyIncome) * 100)
    : 0;

  const realReturn = ((1 + effectiveReturn / 100) / (1 + effectiveInfl / 100)) - 1;
  const monthlyR   = Math.pow(1 + realReturn, 1 / 12) - 1;

  function yearsToFIRE(corpus: number): number | null {
    if (corpus <= 0 || effectiveSavings >= corpus) return 0;
    if (monthlySavings <= 0) return null;
    if (monthlyR > 0.0001) {
      const n = Math.log(
        (corpus * monthlyR + monthlySavings) / (effectiveSavings * monthlyR + monthlySavings)
      ) / Math.log(1 + monthlyR);
      return n > 0 ? Math.round((n / 12) * 10) / 10 : 0;
    }
    return Math.round(((corpus - effectiveSavings) / monthlySavings / 12) * 10) / 10;
  }

  const fireVariants = VARIANTS.map(v => {
    const monthlyTarget = effectiveExp * v.expMultiplier;
    const corpus        = monthlyTarget > 0 ? (monthlyTarget * 12) / v.withdrawalRate : 0;
    const years         = yearsToFIRE(corpus);
    const pct           = corpus > 0 ? Math.min((effectiveSavings / corpus) * 100, 100) : 0;
    const retirementAge = curAge && years !== null && years > 0
      ? Math.round(parseFloat(curAge) + years)
      : null;
    return { ...v, corpus, years, pct, retirementAge };
  });

  const chartData = useMemo(() => {
    const maxDefinedYears = fireVariants.reduce((m, v) => v.years !== null ? Math.max(m, v.years) : m, 0);
    const maxYears        = Math.min(Math.ceil(maxDefinedYears + 5), 50) || 30;
    return Array.from({ length: maxYears + 1 }, (_, i) => {
      const months = i * 12;
      const growth = monthlyR > 0.0001
        ? effectiveSavings * Math.pow(1 + monthlyR, months) +
          (monthlySavings > 0 ? monthlySavings * (Math.pow(1 + monthlyR, months) - 1) / monthlyR : 0)
        : effectiveSavings + Math.max(0, monthlySavings) * months;
      return { year: i, savings: Math.round(Math.max(effectiveSavings, growth)) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSavings, monthlySavings, monthlyR]);

  const handleSave = () => {
    const formData = new FormData();
    if (settings.id) formData.set("id", settings.id);
    formData.set("monthly_expenses_override", monthlyExp);
    formData.set("current_savings_override",  curSavings);
    formData.set("annual_return_rate",         returnRate || "12");
    formData.set("annual_inflation_rate",      inflRate   || "6");
    formData.set("current_age",                curAge);
    formData.set("target_retirement_age",      settings.target_retirement_age?.toString() ?? "");
    formData.set("currency",                   settings.currency);
    startTransition(async () => {
      const result = await upsertFireSettings(null, formData);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("FIRE settings saved");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">

      {/* ── Settings ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-foreground">Settings</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Leave blank to use auto-detected values from your accounts
            </p>
          </div>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Monthly Expenses</Label>
            <Input
              type="number" min="0" step="100"
              placeholder={autoData.avgMonthlyExpenses > 0 ? `Auto: ${formatCompact(autoData.avgMonthlyExpenses)}` : "e.g. 50000"}
              value={monthlyExp}
              onChange={e => setMonthlyExp(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Current Savings</Label>
            <Input
              type="number" min="0" step="1000"
              placeholder={autoData.totalSavings > 0 ? `Auto: ${formatCompact(autoData.totalSavings)}` : "e.g. 1000000"}
              value={curSavings}
              onChange={e => setCurSavings(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Monthly Income (auto)</Label>
            <Input
              type="number" readOnly
              value={autoData.avgMonthlyIncome || ""}
              placeholder="From accounts"
              className="cursor-not-allowed opacity-60"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Return Rate (%/yr)</Label>
            <Input
              type="number" min="0" max="50" step="0.5"
              value={returnRate}
              onChange={e => setReturnRate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Inflation Rate (%/yr)</Label>
            <Input
              type="number" min="0" max="30" step="0.5"
              value={inflRate}
              onChange={e => setInflRate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Current Age</Label>
            <Input
              type="number" min="18" max="80" step="1"
              placeholder="—"
              value={curAge}
              onChange={e => setCurAge(e.target.value)}
            />
          </div>
        </div>

        {effectiveExp > 0 && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Monthly savings:{" "}
            <span className={`font-medium ${monthlySavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
              {monthlySavings >= 0 ? "+" : ""}{formatCompact(monthlySavings)}
            </span>
            {" · "}Savings rate:{" "}
            <span className="font-medium text-foreground">{savingsRate}%</span>
          </p>
        )}
      </div>

      {/* ── FIRE Variant Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {fireVariants.map(v => (
          <div key={v.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: v.color }}
              />
              <span className="text-[13px] font-semibold text-foreground">{v.label}</span>
            </div>
            <p className="mb-4 text-[11px] text-muted-foreground">
              {Math.round(v.expMultiplier * 100)}% of expenses · {Math.round(v.withdrawalRate * 100)}% withdrawal
            </p>

            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Corpus Needed
            </p>
            <p className="mb-4 text-xl font-semibold tabular-nums text-foreground">
              {v.corpus > 0 ? formatCompact(v.corpus) : "—"}
            </p>

            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Progress</span>
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: v.color }}>
                {Math.round(v.pct)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${v.pct}%`, backgroundColor: v.color }}
              />
            </div>
            <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">
              {formatCompact(effectiveSavings)} of {v.corpus > 0 ? formatCompact(v.corpus) : "—"}
            </p>

            <div className="mt-3 border-t border-border pt-3">
              {v.years === null ? (
                <p className="text-[11px] text-muted-foreground">
                  Increase monthly savings to compute timeline
                </p>
              ) : v.years === 0 ? (
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Already reached!
                </p>
              ) : (
                <>
                  <p className="text-[13px] font-semibold text-foreground">≈ {v.years} years</p>
                  {v.retirementAge && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Retire at age {v.retirementAge}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Projection Chart ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-[13px] font-semibold text-foreground">Savings Projection</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}y`}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatCompact(v)}
                width={58}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-sm text-xs">
                      <p className="mb-1 text-muted-foreground">Year {label}</p>
                      <p className="font-semibold text-foreground">
                        {formatCompact(payload[0].value as number)}
                      </p>
                    </div>
                  );
                }}
              />
              {fireVariants.map(v =>
                v.corpus > 0 ? (
                  <ReferenceLine
                    key={v.label}
                    y={v.corpus}
                    stroke={v.color}
                    strokeDasharray="4 2"
                    strokeWidth={1.5}
                    label={{
                      value: v.label,
                      position: "insideTopRight",
                      fontSize: 9,
                      fill: v.color,
                    }}
                  />
                ) : null
              )}
              <Line
                type="monotone"
                dataKey="savings"
                stroke="var(--foreground)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "var(--foreground)", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {monthlySavings <= 0 && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Add positive monthly savings to see growth projection
          </p>
        )}
      </div>
    </div>
  );
}
