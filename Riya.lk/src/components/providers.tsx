"use client";

import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { useTheme, useThemeSync } from "@/components/theme/theme";
import { I18nProvider } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/** App-wide client providers: translations, animation settings and toasts. */
export function Providers({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  useThemeSync();
  const { resolvedTheme } = useTheme();

  return (
    <I18nProvider locale={locale} dictionary={dictionary}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      <Toaster theme={resolvedTheme} position="top-center" richColors closeButton toastOptions={{ className: "font-sans" }} />
    </I18nProvider>
  );
}
