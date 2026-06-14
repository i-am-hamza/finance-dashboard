"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function getEffectiveIsDark(theme: Theme): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");

  // Read stored preference after mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    setThemeState(stored ?? "system");
  }, []);

  // Listen for OS-level changes when in system mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(next: Theme) {
    const isDark = getEffectiveIsDark(next);
    document.documentElement.classList.toggle("dark", isDark);
    if (next === "system") {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", next);
    }
    setThemeState(next);
  }

  function toggle() {
    // When on system, resolve to the opposite of the current effective mode
    const currentlyDark = getEffectiveIsDark(theme);
    setTheme(currentlyDark ? "light" : "dark");
  }

  const isDark = getEffectiveIsDark(theme);

  return { theme, isDark, setTheme, toggle };
}
