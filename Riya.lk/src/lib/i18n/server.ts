/**
 * Server-side i18n. The language is stored in a cookie (no /si/ or /ta/ URL
 * prefixes), falling back to the browser's Accept-Language header.
 */
import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE } from "../constants";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { dictionaries } from "./dictionaries";

export const getLocale = cache(async (): Promise<Locale> => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const accept = (await headers()).get("accept-language")?.toLowerCase() ?? "";
  if (accept.startsWith("si")) return "si";
  if (accept.startsWith("ta")) return "ta";
  return DEFAULT_LOCALE;
});

/** `{ locale, t }` for server components. */
export const getI18n = cache(async () => {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
});
