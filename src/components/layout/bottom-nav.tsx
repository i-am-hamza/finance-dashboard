"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  ReceiptText,
  TrendingUp,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",       label: "Home",      icon: LayoutDashboard },
  { href: "/accounts",        label: "Accounts",  icon: Wallet          },
  { href: "/spending",        label: "Spending",  icon: ReceiptText     },
  { href: "/portfolio",       label: "Portfolio", icon: TrendingUp      },
  { href: "/dashboard/goals", label: "Goals",     icon: Target          },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex h-16 items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                className="flex flex-1 flex-col items-center justify-center gap-1 transition-colors"
                aria-current={isActive ? "page" : undefined}
              >
                {/* Icon with active pill background */}
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800"
                      : "bg-transparent"
                  )}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    className={cn(
                      "transition-colors",
                      isActive
                        ? "text-slate-700 dark:text-slate-200"
                        : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                </span>

                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none transition-colors",
                    isActive
                      ? "text-slate-700 dark:text-slate-200"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
