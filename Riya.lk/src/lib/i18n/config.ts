export const LOCALES = ["en", "si", "ta"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, { short: string; native: string }> = {
  en: { short: "EN", native: "English" },
  si: { short: "සිං", native: "සිංහල" },
  ta: { short: "த", native: "தமிழ்" },
};

/** BCP-47 tags used for Intl APIs and <html lang>. */
export const LOCALE_TAGS: Record<Locale, string> = { en: "en-LK", si: "si-LK", ta: "ta-LK" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Replaces {placeholders} in a translated string. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

/** "1 ad" / "5 ads" in the visitor's language. */
export function adsCount(t: { search: { resultsCount: string; resultsCountOne: string } }, count: number): string {
  return count === 1 ? t.search.resultsCountOne : fmt(t.search.resultsCount, { count: count.toLocaleString("en-LK") });
}

/** Picks the localised name of a category row. */
export function categoryName(
  category: { nameEn: string; nameSi: string; nameTa: string } | null | undefined,
  locale: Locale,
): string {
  if (!category) return "";
  return locale === "si" ? category.nameSi : locale === "ta" ? category.nameTa : category.nameEn;
}

/** "3 hours ago" in the visitor's language. */
export function timeAgo(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.round((d.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(LOCALE_TAGS[locale], { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, "minute");
}

export function formatDate(date: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], { year: "numeric", month: "short", day: "numeric" }).format(
    typeof date === "string" ? new Date(date) : date,
  );
}
