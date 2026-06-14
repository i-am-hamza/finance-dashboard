"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<string, string> = {
  "/":          "Home",
  "/accounts":  "Accounts",
  "/debts":     "Debts",
  "/spending":  "Spending",
  "/portfolio": "Portfolio",
  "/settings":  "Settings",
};

function getSectionLabel(pathname: string): string {
  if (SECTION_LABELS[pathname]) return SECTION_LABELS[pathname];
  const prefix = Object.keys(SECTION_LABELS)
    .filter((k) => k !== "/" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? SECTION_LABELS[prefix] : "Finance Dashboard";
}

const iconBtn = cn(
  "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
  "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
  "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
);

export function TopBar() {
  const pathname = usePathname();
  const label = getSectionLabel(pathname);
  const isSettings = pathname.startsWith("/settings");

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        {label}
      </span>

      <div className="flex items-center gap-1">
        <ThemeToggle variant="icon" />

        {!isSettings && (
          <Link href="/settings" aria-label="Settings" className={iconBtn}>
            <Settings size={16} />
          </Link>
        )}
      </div>
    </header>
  );
}
