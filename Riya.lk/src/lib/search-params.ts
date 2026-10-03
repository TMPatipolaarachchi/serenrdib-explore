/**
 * Search filter parsing and URL building, shared by server pages and the
 * client-side filter panel.
 *
 * URLs: /search?q=…&brand=…  or, when a category is chosen, the SEO-friendly
 * /category/<slug>?brand=…
 */
import {
  CONDITIONS,
  FUEL_TYPES,
  SORT_OPTIONS,
  TRANSMISSIONS,
  type Condition,
  type FuelType,
  type SortOption,
  type Transmission,
} from "./constants";
import { firstParam, toInt } from "./utils";

export interface AdFilters {
  q?: string;
  category?: string;
  brand?: string;
  model?: string;
  district?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  condition?: Condition;
  fuelType?: FuelType;
  transmission?: Transmission;
  sort: SortOption;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function pickEnum<T extends readonly string[]>(values: T, raw: string | undefined): T[number] | undefined {
  return raw && (values as readonly string[]).includes(raw) ? (raw as T[number]) : undefined;
}

/** Parses URL search params into validated filters (unknown values are ignored). */
export function parseAdFilters(params: RawParams): AdFilters {
  return {
    q: firstParam(params.q)?.trim().slice(0, 100) || undefined,
    category: firstParam(params.category),
    brand: firstParam(params.brand),
    model: firstParam(params.model),
    district: firstParam(params.district),
    city: firstParam(params.city),
    minPrice: toInt(params.minPrice),
    maxPrice: toInt(params.maxPrice),
    minYear: toInt(params.minYear),
    maxYear: toInt(params.maxYear),
    condition: pickEnum(CONDITIONS, firstParam(params.condition)),
    fuelType: pickEnum(FUEL_TYPES, firstParam(params.fuelType)),
    transmission: pickEnum(TRANSMISSIONS, firstParam(params.transmission)),
    sort: pickEnum(SORT_OPTIONS, firstParam(params.sort)) ?? "newest",
    page: Math.max(1, toInt(params.page) ?? 1),
  };
}

/** Builds the URL for a set of filters (drops empty values and defaults). */
export function searchHref(filters: Partial<AdFilters>): string {
  const { category, page, sort, ...rest } = filters;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  if (sort && sort !== "newest") params.set("sort", sort);
  if (page && page > 1) params.set("page", String(page));
  const path = category ? `/category/${category}` : "/search";
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Number of active filters (excluding keyword, sort and page) — shown on the Filters button. */
export function activeFilterCount(f: Partial<AdFilters>): number {
  return [
    f.category,
    f.brand,
    f.model,
    f.district,
    f.city,
    f.minPrice ?? f.maxPrice,
    f.minYear ?? f.maxYear,
    f.condition,
    f.fuelType,
    f.transmission,
  ].filter((v) => v !== undefined && v !== "").length;
}
