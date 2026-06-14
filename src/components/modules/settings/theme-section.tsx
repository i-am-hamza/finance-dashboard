"use client";

import { Sun, Monitor, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light",  label: "Light",  Icon: Sun     },
  { value: "system", label: "System", Icon: Monitor  },
  { value: "dark",   label: "Dark",   Icon: Moon    },
] as const;

type ThemeValue = "light" | "system" | "dark";

export function ThemeSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value as ThemeValue)}
            aria-pressed={active}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={14} strokeWidth={active ? 2.25 : 1.75} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
