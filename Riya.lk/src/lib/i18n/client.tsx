"use client";

/**
 * Client-side i18n context. The root layout passes the active dictionary in,
 * so client components can translate without extra network requests.
 */
import { createContext, useCallback, useContext } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

interface I18nValue {
  locale: Locale;
  t: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, dictionary, children }: { locale: Locale; dictionary: Dictionary; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t: dictionary }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** Translates an error key from the API/validation layer, falling back to the raw text. */
export function useErrorText() {
  const { t } = useI18n();
  return useCallback(
    (key: string | undefined | null): string | undefined => {
      if (!key) return undefined;
      return (t.errors as Record<string, string>)[key] ?? key;
    },
    [t],
  );
}
