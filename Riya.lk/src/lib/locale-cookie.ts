import { LOCALE_COOKIE } from "./constants";
import type { Locale } from "./i18n/config";

/** Remembers the visitor's language for a year (read on the server by getLocale()). */
export function saveLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}
