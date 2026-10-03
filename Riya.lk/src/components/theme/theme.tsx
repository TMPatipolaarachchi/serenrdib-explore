"use client";

/**
 * Light / dark / system theme — a tiny replacement for next-themes.
 *
 *  • <ThemeScript /> (in <head>) applies the saved theme before first paint,
 *    so there's no flash of the wrong theme.
 *  • useTheme() reads the choice and changes it. The `.dark` class on <html>
 *    is updated imperatively (never in a render effect), so hydration can't
 *    briefly undo what the inline script set.
 */
import { useCallback, useLayoutEffect, useSyncExternalStore } from "react";
import { InlineScript } from "./inline-script";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Runs before first paint; kept dependency-free and wrapped in try/catch (localStorage can throw). */
const INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");var d=t==="dark"||(t!=="light"&&window.matchMedia("${DARK_QUERY}").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light"}catch(_){}})()`;

export function ThemeScript() {
  return <InlineScript html={INIT_SCRIPT} />;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? systemTheme() : theme;
}

/** Sets the class on <html>, briefly disabling CSS transitions so colours switch instantly. */
function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  void window.getComputedStyle(document.body).opacity; // force a reflow before re-enabling transitions
  requestAnimationFrame(() => style.remove());
}

function sync() {
  applyTheme(resolve(readTheme()));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    // Follow OS theme changes (when on "system") and changes made in other tabs.
    window.matchMedia(DARK_QUERY).addEventListener("change", sync);
    window.addEventListener("storage", onStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.matchMedia(DARK_QUERY).removeEventListener("change", sync);
      window.removeEventListener("storage", onStorage);
    }
  };
}

function onStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY) sync();
}

// A string snapshot keeps useSyncExternalStore's equality check cheap and stable.
const getSnapshot = () => `${readTheme()}:${systemTheme()}`;
const getServerSnapshot = () => "system:light";

/**
 * Safety net for pages React renders on the client instead of hydrating (e.g.
 * some not-found pages): the inline script's class would be lost, so re-apply
 * it before paint. On normal page loads the class already matches — no-op.
 */
export function useThemeSync() {
  useLayoutEffect(() => {
    const resolved = resolve(readTheme());
    const root = document.documentElement;
    if (root.classList.contains("dark") !== (resolved === "dark") || root.style.colorScheme !== resolved) {
      root.classList.toggle("dark", resolved === "dark");
      root.style.colorScheme = resolved;
    }
  }, []);
}

export function useTheme() {
  const [theme, system] = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).split(":") as [Theme, ResolvedTheme];

  const setTheme = useCallback((next: Theme) => {
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable (private mode) — still switch for this page view */
      applyTheme(resolve(next));
      return;
    }
    sync();
  }, []);

  return { theme, resolvedTheme: theme === "system" ? system : theme, setTheme };
}
