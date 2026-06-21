"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Trophy, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalForm } from "@/components/modules/goals/goal-form";
import { deleteGoal, markGoalAchieved } from "@/lib/actions/goals";
import { formatCompact } from "@/lib/utils/currency";
import type { Goal } from "@/lib/services/goals";

const STATUS_COLORS: Record<string, string> = {
  active:   "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  achieved: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
  paused:   "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

function GoalCard({ goal }: { goal: Goal }) {
  const router  = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const effectiveAmount = goal.current_amount_override ?? goal.current_amount;
  const pct = goal.target_amount > 0
    ? Math.min((effectiveAmount / goal.target_amount) * 100, 100)
    : 0;

  let estCompletion: string | null = null;
  if (
    goal.monthly_contribution &&
    goal.monthly_contribution > 0 &&
    effectiveAmount < goal.target_amount
  ) {
    const monthsLeft = (goal.target_amount - effectiveAmount) / goal.monthly_contribution;
    const date = new Date();
    date.setMonth(date.getMonth() + Math.ceil(monthsLeft));
    estCompletion = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteGoal(goal.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Goal deleted");
        router.refresh();
      }
    });
  };

  const handleAchieve = () => {
    startTransition(async () => {
      const result = await markGoalAchieved(goal.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Goal marked as achieved!");
        router.refresh();
      }
    });
  };

  return (
    <>
      <GoalForm open={editOpen} onOpenChange={setEditOpen} existing={goal} />
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">{goal.name}</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{goal.category}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_COLORS[goal.status] ?? STATUS_COLORS.active}`}
          >
            {goal.status}
          </span>
        </div>

        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Progress</span>
          <span className="text-[11px] font-semibold tabular-nums text-foreground">
            {Math.round(pct)}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mb-3 mt-1.5 text-[11px] tabular-nums text-muted-foreground">
          {formatCompact(effectiveAmount)} of {formatCompact(goal.target_amount)}
        </p>

        <div className="space-y-1 text-[11px] text-muted-foreground">
          {goal.monthly_contribution != null && goal.monthly_contribution > 0 && (
            <p>
              Monthly:{" "}
              <span className="font-medium text-foreground">
                {formatCompact(goal.monthly_contribution)}
              </span>
            </p>
          )}
          {goal.target_date && (
            <p>
              Target:{" "}
              <span className="font-medium text-foreground">
                {new Date(goal.target_date).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            </p>
          )}
          {estCompletion && (
            <p>
              Est. done:{" "}
              <span className="font-medium text-foreground">{estCompletion}</span>
            </p>
          )}
          {goal.notes && (
            <p className="italic text-muted-foreground/70 line-clamp-2">{goal.notes}</p>
          )}
        </div>

        {goal.status !== "achieved" && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
            {!confirmDelete ? (
              <>
                <Button size="xs" variant="outline" onClick={handleAchieve} disabled={isPending}>
                  {isPending ? <Loader2 size={11} className="animate-spin" /> : <Trophy size={11} />}
                  Achieved
                </Button>
                <Button size="xs" variant="outline" onClick={() => setEditOpen(true)} disabled={isPending}>
                  <Pencil size={11} />
                  Edit
                </Button>
                <Button size="xs" variant="destructive" onClick={() => setConfirmDelete(true)} disabled={isPending}>
                  <Trash2 size={11} />
                  Delete
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Sure?</span>
                <Button size="xs" variant="destructive" onClick={handleDelete} disabled={isPending}>
                  {isPending && <Loader2 size={11} className="animate-spin" />}
                  Yes, delete
                </Button>
                <Button size="xs" variant="outline" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

interface Props {
  initialGoals: Goal[];
}

export function GoalsList({ initialGoals }: Props) {
  const [addOpen, setAddOpen] = useState(false);

  const active   = initialGoals.filter(g => g.status === "active");
  const paused   = initialGoals.filter(g => g.status === "paused");
  const achieved = initialGoals.filter(g => g.status === "achieved");

  return (
    <>
      <GoalForm open={addOpen} onOpenChange={setAddOpen} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">
            {active.length} active · {achieved.length} achieved
          </p>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={13} />
            Add Goal
          </Button>
        </div>

        {initialGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16">
            <Target size={32} className="text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No goals yet</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Set a financial goal to start tracking your progress
              </p>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus size={13} />
              Add your first goal
            </Button>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map(g => <GoalCard key={g.id} goal={g} />)}
              </div>
            )}

            {paused.length > 0 && (
              <div>
                <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Paused
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paused.map(g => <GoalCard key={g.id} goal={g} />)}
                </div>
              </div>
            )}

            {achieved.length > 0 && (
              <div>
                <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Achieved
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {achieved.map(g => <GoalCard key={g.id} goal={g} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
