"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { saveLocaleCookie } from "@/lib/locale-cookie";
import { useClickOutside } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/** Sinhala / English / Tamil switcher. Saves the choice in a cookie and re-renders. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    saveLocaleCookie(next);
    startTransition(() => router.refresh());
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground",
          pending && "animate-pulse",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.nav.language}
      >
        <Languages className="size-[18px]" />
        <span>{LOCALE_LABELS[locale].short}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl"
          >
            {LOCALES.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l === locale}
                  onClick={() => choose(l)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-muted",
                    l === locale && "font-semibold text-brand-700 dark:text-brand-300",
                  )}
                >
                  {LOCALE_LABELS[l].native}
                  {l === locale && <Check className="size-4" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
