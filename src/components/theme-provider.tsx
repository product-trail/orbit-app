"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-constants";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "dark";
}

/**
 * Minimal theme provider (light/dark/system) backed by localStorage.
 *
 * Deliberately hand-rolled instead of using `next-themes`: that library
 * renders a raw <script> element into the React tree to avoid a flash of
 * unstyled content, which triggers a React 19 dev warning ("Encountered a
 * script tag while rendering React component") on every render. We get the
 * same FOUC-free behavior via a `next/script` `beforeInteractive` tag
 * (see RootLayout) — the officially sanctioned mechanism for this — paired
 * with this tiny context for state after hydration.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Matches whatever the blocking inline script already applied to <html>,
  // so there's no flicker and no hydration mismatch.
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    theme === "system" ? getSystemTheme() : theme,
  );

  const applyTheme = useCallback((next: ResolvedTheme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    setResolvedTheme(next);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      applyTheme(next === "system" ? getSystemTheme() : next);
    },
    [applyTheme],
  );

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme(getSystemTheme());
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme, applyTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
