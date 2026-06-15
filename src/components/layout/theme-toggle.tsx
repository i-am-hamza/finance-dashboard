"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** "icon" = compact square button. "row" = full-width sidebar row. */
  variant?: "icon" | "row";
}

export function ThemeToggle({ variant = "icon" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isDark = resolvedTheme === "dark";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  if (variant === "row") {
    return (
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-300"
      >
        {mounted
          ? (isDark ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />)
          : <div className="h-4 w-4 shrink-0" />}
        {mounted ? (isDark ? "Light mode" : "Dark mode") : "Theme"}
      </button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={toggle}
        aria-label="Toggle theme"
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
          "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
          "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        )}
      >
        {mounted
          ? (isDark ? <Sun size={16} /> : <Moon size={16} />)
          : <div className="h-4 w-4" />}
      </TooltipTrigger>
      <TooltipContent side="right">Toggle theme</TooltipContent>
    </Tooltip>
  );
}
