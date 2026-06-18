"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  ReceiptText,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/services/auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home",      icon: LayoutDashboard },
  { href: "/accounts",  label: "Accounts",  icon: Wallet          },
  { href: "/debts",     label: "Debts",     icon: CreditCard      },
  { href: "/spending",  label: "Spending",  icon: ReceiptText     },
  { href: "/portfolio", label: "Portfolio", icon: TrendingUp      },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-300"
      )}
    >
      <Icon
        size={16}
        strokeWidth={isActive ? 2.25 : 1.75}
        className="shrink-0"
      />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-border bg-background md:flex">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <Image
          src="/Finora icon.png"
          alt="Finora"
          width={28}
          height={28}
          className="dark:invert"
        />
        <span className="text-[13px] font-semibold tracking-tight text-foreground">
          Finora
        </span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const isActive =
              href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
            return (
              <li key={href}>
                <NavLink
                  href={href}
                  label={label}
                  icon={icon}
                  isActive={isActive}
                />
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: Settings, theme toggle, sign out */}
      <div className="border-t border-border px-3 py-3">
        <ul className="space-y-0.5">
          <li>
            <NavLink
              href="/settings"
              label="Settings"
              icon={Settings}
              isActive={pathname.startsWith("/settings")}
            />
          </li>
          <li>
            <ThemeToggle variant="row" />
          </li>
          <li>
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-300"
              >
                <LogOut size={16} className="shrink-0" />
                Sign out
              </button>
            </form>
          </li>
        </ul>
      </div>
    </aside>
  );
}
