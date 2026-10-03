"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** Switches between light and dark mode. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  // During hydration useTheme() returns the server value ("light"), then updates — no mismatch.
  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "relative flex size-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground",
        className,
      )}
      aria-label={`${t.nav.theme}: ${dark ? t.nav.dark : t.nav.light}`}
      title={dark ? t.nav.light : t.nav.dark}
    >
      <Sun className={cn("size-5 transition-all", dark ? "scale-0 rotate-90" : "scale-100 rotate-0")} />
      <Moon className={cn("absolute size-5 transition-all", dark ? "scale-100 rotate-0" : "scale-0 -rotate-90")} />
    </button>
  );
}
