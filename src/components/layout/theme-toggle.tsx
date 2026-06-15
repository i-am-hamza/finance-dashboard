"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** "icon" = compact square button. "row" = full-width sidebar row. */
  variant?: "icon" | "row";
}

export function ThemeToggle({ variant = "icon" }: ThemeToggleProps) {
  const { isDark, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Before mount, use a neutral label so SSR and client HTML match.
  const label = mounted
    ? (isDark ? "Switch to light mode" : "Switch to dark mode")
    : "Toggle theme";

  if (variant === "row") {
    return (
      <button
        onClick={toggle}
        aria-label={label}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-300"
      >
        {isDark ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
        {isDark ? "Light mode" : "Dark mode"}
      </button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={toggle}
        aria-label={label}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
          "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
          "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        )}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
