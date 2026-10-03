/**
 * App-wide constants. Enum value lists mirror the Prisma enums so that client
 * components never need to import the generated Prisma client.
 */

export const SITE_NAME = "Riya.lk";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const MAX_AD_IMAGES = 10;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // after client-side compression
export const ADS_PER_PAGE = 24;
export const MAX_PRICE = 2_000_000_000; // LKR — fits in a Postgres INT

export const CONDITIONS = ["NEW", "USED", "RECONDITIONED"] as const;
export const FUEL_TYPES = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "CNG", "OTHER"] as const;
export const TRANSMISSIONS = ["MANUAL", "AUTOMATIC", "TIPTRONIC", "OTHER"] as const;
export const AD_STATUSES = ["PENDING", "ACTIVE", "REJECTED", "SOLD", "EXPIRED"] as const;
export const CATEGORY_TYPES = ["VEHICLE", "PART", "ACCESSORY", "SERVICE"] as const;
export const REPORT_REASONS = [
  "SPAM",
  "FRAUD",
  "DUPLICATE",
  "WRONG_CATEGORY",
  "ALREADY_SOLD",
  "OFFENSIVE",
  "OTHER",
] as const;

export type Condition = (typeof CONDITIONS)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type AdStatus = (typeof AD_STATUSES)[number];
export type CategoryType = (typeof CATEGORY_TYPES)[number];
export type ReportReason = (typeof REPORT_REASONS)[number];

export const SORT_OPTIONS = ["newest", "oldest", "price_asc", "price_desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

/** Oldest model year accepted in the ad form. */
export const MIN_YEAR = 1950;
export const currentYear = () => new Date().getFullYear();

/** Cookie that stores the visitor's language. */
export const LOCALE_COOKIE = "riya_locale";
