/**
 * Ad queries shared by pages and API routes: search/filtering, card data,
 * and the homepage sections.
 */
import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { getCategoryScope, getCategories } from "./categories";
import { ADS_PER_PAGE, type SortOption } from "./constants";
import type { AdFilters } from "./search-params";

export { parseAdFilters, type AdFilters } from "./search-params";

/** Fields needed to render an ad card. */
export const adCardSelect = {
  id: true,
  slug: true,
  title: true,
  price: true,
  negotiable: true,
  condition: true,
  district: true,
  city: true,
  year: true,
  mileage: true,
  fuelType: true,
  transmission: true,
  isFeatured: true,
  isTopAd: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  category: { select: { slug: true, nameEn: true, nameSi: true, nameTa: true, icon: true } },
  images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
  _count: { select: { images: true } },
} satisfies Prisma.AdSelect;

export type AdCardData = Prisma.AdGetPayload<{ select: typeof adCardSelect }>;

// ----------------------------------------------------------------------------
// Search
// ----------------------------------------------------------------------------

function orderByFor(sort: SortOption): Prisma.AdOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ publishedAt: "asc" }];
    case "price_asc":
      return [{ price: { sort: "asc", nulls: "last" } }, { publishedAt: "desc" }];
    case "price_desc":
      return [{ price: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }];
    default:
      // Top ads are pinned above everything else in the default sort.
      return [{ isTopAd: "desc" }, { publishedAt: "desc" }];
  }
}

/** Builds the Prisma `where` for a filter set. Returns null if nothing can match. */
export async function buildAdWhere(filters: AdFilters): Promise<Prisma.AdWhereInput | null> {
  const and: Prisma.AdWhereInput[] = [{ status: "ACTIVE" }];

  if (filters.q) {
    // Every word must appear somewhere in the title, description, brand or model.
    const words = filters.q.split(/\s+/).filter(Boolean).slice(0, 6);
    for (const word of words) {
      const contains = { contains: word, mode: "insensitive" as const };
      and.push({
        OR: [
          { title: contains },
          { description: contains },
          { modelText: contains },
          { brand: { name: contains } },
          { model: { name: contains } },
        ],
      });
    }
  }

  if (filters.category) {
    const scope = await getCategoryScope(filters.category);
    if (!scope) return null;
    and.push({ categoryId: { in: scope.ids } });
  }

  if (filters.brand) and.push({ brand: { slug: filters.brand } });
  if (filters.model) and.push({ model: { slug: filters.model } });
  if (filters.district) and.push({ district: filters.district });
  if (filters.city) and.push({ city: filters.city });
  if (filters.minPrice != null || filters.maxPrice != null) {
    and.push({ price: { gte: filters.minPrice, lte: filters.maxPrice } });
  }
  if (filters.minYear != null || filters.maxYear != null) {
    and.push({ year: { gte: filters.minYear, lte: filters.maxYear } });
  }
  if (filters.condition) and.push({ condition: filters.condition });
  if (filters.fuelType) and.push({ fuelType: filters.fuelType });
  if (filters.transmission) and.push({ transmission: filters.transmission });

  return { AND: and };
}

export async function searchAds(filters: AdFilters, perPage = ADS_PER_PAGE) {
  const where = await buildAdWhere(filters);
  if (!where) return { ads: [] as AdCardData[], total: 0, page: 1, pageCount: 0 };

  // Plain parallel reads — no transaction needed (and none to wait for under load).
  const [total, ads] = await Promise.all([
    prisma.ad.count({ where }),
    prisma.ad.findMany({
      where,
      orderBy: orderByFor(filters.sort),
      skip: (filters.page - 1) * perPage,
      take: perPage,
      select: adCardSelect,
    }),
  ]);

  return { ads, total, page: filters.page, pageCount: Math.ceil(total / perPage) };
}

// ----------------------------------------------------------------------------
// Homepage
// ----------------------------------------------------------------------------

export async function getFeaturedAds(take = 8) {
  return prisma.ad.findMany({
    where: { status: "ACTIVE", isFeatured: true },
    orderBy: { publishedAt: "desc" },
    take,
    select: adCardSelect,
  });
}

export async function getLatestAds(take = 12) {
  return prisma.ad.findMany({
    where: { status: "ACTIVE" },
    orderBy: { publishedAt: "desc" },
    take,
    select: adCardSelect,
  });
}

/** Active ad counts per top-level category slug (children roll up to parents). */
export async function getCategoryAdCounts(): Promise<Record<string, number>> {
  const [groups, categories] = await Promise.all([
    prisma.ad.groupBy({ by: ["categoryId"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    getCategories(),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const counts: Record<string, number> = {};
  for (const g of groups) {
    const cat = byId.get(g.categoryId);
    if (!cat) continue;
    const top = cat.parentId ? byId.get(cat.parentId) ?? cat : cat;
    counts[top.slug] = (counts[top.slug] ?? 0) + g._count._all;
  }
  return counts;
}

// ----------------------------------------------------------------------------
// Ad detail page
// ----------------------------------------------------------------------------

/** Statuses anyone can see. Pending/rejected ads are visible to their owner only. */
export const PUBLIC_AD_STATUSES = new Set(["ACTIVE", "SOLD"]);

/** Everything the ad page needs (deduplicated per request with React `cache`). */
export const getAdDetail = cache(async (slug: string) =>
  prisma.ad.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: { include: { parent: true } },
      brand: true,
      model: true,
      user: { select: { id: true, name: true, image: true, createdAt: true, phoneVerifiedAt: true } },
    },
  }),
);

/** Ids of the ads a user has saved (empty for visitors). */
export async function getFavouriteIds(userId: string | null | undefined): Promise<string[]> {
  if (!userId) return [];
  const favs = await prisma.favourite.findMany({ where: { userId }, select: { adId: true } });
  return favs.map((f) => f.adId);
}

/** Ads similar to the given one (same category, then same brand). */
export async function getSimilarAds(ad: { id: string; categoryId: string; brandId: string | null }, take = 8) {
  return prisma.ad.findMany({
    where: {
      status: "ACTIVE",
      id: { not: ad.id },
      OR: [{ categoryId: ad.categoryId }, ...(ad.brandId ? [{ brandId: ad.brandId }] : [])],
    },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take,
    select: adCardSelect,
  });
}
