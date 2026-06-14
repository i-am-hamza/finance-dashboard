"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { monthLabel, shiftMonthKey, currentMonthKey } from "@/lib/utils/date";

interface Props {
  month: string;
}

export function MonthSelector({ month }: Props) {
  const router = useRouter();
  const isCurrent = month === currentMonthKey();

  const go = (mk: string) => router.push(`?month=${mk}`);

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon-sm"
        variant="outline"
        onClick={() => go(shiftMonthKey(month, -1))}
        aria-label="Previous month"
      >
        <ChevronLeft size={14} />
      </Button>

      <span className="min-w-[96px] text-center text-sm font-medium tabular-nums px-1">
        {monthLabel(month)}
        {isCurrent && (
          <span className="ml-1 text-[10px] font-normal text-muted-foreground">(current)</span>
        )}
      </span>

      <Button
        size="icon-sm"
        variant="outline"
        onClick={() => go(shiftMonthKey(month, 1))}
        aria-label="Next month"
      >
        <ChevronRight size={14} />
      </Button>
    </div>
  );
}
