import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind classes, letting later classes win over earlier ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 6850000 → "Rs 6,850,000" */
export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "";
  return `Rs ${price.toLocaleString("en-LK")}`;
}

/** 6850000 → "68.5 Lakhs" style compact price used on cards (Sri Lankan convention). */
export function formatPriceCompact(price: number | null | undefined): string {
  if (price == null) return "";
  if (price >= 10_000_000) return `Rs ${trim(price / 10_000_000)} Cr`;
  if (price >= 100_000) return `Rs ${trim(price / 100_000)} Lakhs`;
  return formatPrice(price);
}

function trim(n: number) {
  return n.toFixed(2).replace(/\.?0+$/, "");
}

export function formatNumber(n: number | null | undefined): string {
  return n == null ? "" : n.toLocaleString("en-LK");
}

/**
 * Normalises a Sri Lankan mobile number to E.164 ("+947XXXXXXXX").
 * Accepts 07XXXXXXXX, 7XXXXXXXX, 947XXXXXXXX and +947XXXXXXXX (spaces/dashes ignored).
 * Returns null if the number isn't a valid Sri Lankan mobile number.
 */
export function normalizeSriLankanPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  const match = digits.match(/^(?:\+94|0094|94|0)?(7\d{8})$/);
  return match ? `+94${match[1]}` : null;
}

/** "+94771234567" → "077 123 4567" (friendly local format). */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const m = phone.match(/^\+94(\d{2})(\d{3})(\d{4})$/);
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : phone;
}

/** "+94771234567" → "94771234567" (format expected by wa.me links). */
export function whatsappNumber(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/** Hides the middle of a phone number: "077 12• ••67". */
export function maskPhone(phone: string): string {
  const f = formatPhone(phone);
  return f.slice(0, 6) + f.slice(6, -2).replace(/\d/g, "•") + f.slice(-2);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Absolute URL for a path, used in metadata, sitemaps and share links. */
export function absoluteUrl(path = "/"): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Truncates text on a word boundary. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : max)}…`;
}

/** Reads a positive integer from a query-string value. */
export function toInt(value: string | string[] | undefined | null): number | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (v == null || v === "") return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Only allow same-site relative redirects (prevents open-redirect attacks). */
export function safeCallbackUrl(url: string | null | undefined, fallback = "/"): string {
  if (!url || !url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) return fallback;
  return url;
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v || undefined;
}
