import Link from "next/link";
import { ChevronRight, SearchX, X } from "lucide-react";
import { AdGrid } from "@/components/ads/ad-grid";
import { Card, Container, EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { SearchFilters } from "./search-filters";
import { SearchToolbar } from "./search-toolbar";
import { getI18n } from "@/lib/i18n/server";
import { adsCount, categoryName, fmt } from "@/lib/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { getCategoryScope, getCategoryTree } from "@/lib/categories";
import { getFavouriteIds, searchAds } from "@/lib/ads";
import { searchHref, type AdFilters } from "@/lib/search-params";
import { cityName, districtName } from "@/lib/data/locations";
import { formatPrice } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

/** Search results page body — used by /search and /category/[slug]. */
export async function SearchView({ filters }: { filters: AdFilters }) {
  const [{ locale, t }, user, categories, result, scope] = await Promise.all([
    getI18n(),
    getCurrentUser(),
    getCategoryTree(),
    searchAds(filters),
    filters.category ? getCategoryScope(filters.category) : null,
  ]);
  const [favouriteIds, brand, model] = await Promise.all([
    getFavouriteIds(user?.id),
    filters.brand ? prisma.brand.findUnique({ where: { slug: filters.brand }, select: { name: true, id: true } }) : null,
    filters.model ? prisma.vehicleModel.findFirst({ where: { slug: filters.model }, select: { name: true } }) : null,
  ]);

  const catName = scope ? categoryName(scope.category, locale) : null;
  const title = filters.q
    ? fmt(t.search.resultsFor, { q: filters.q })
    : catName
      ? fmt(t.search.inCategory, { category: [brand?.name, catName].filter(Boolean).join(" ") })
      : t.search.title;

  // Removable chips for each active filter.
  const chips: { label: string; href: string }[] = [];
  const without = (patch: Partial<AdFilters>) => searchHref({ ...filters, ...patch, page: 1 });
  if (filters.q) chips.push({ label: `“${filters.q}”`, href: without({ q: undefined }) });
  if (catName) chips.push({ label: catName, href: without({ category: undefined, brand: undefined, model: undefined }) });
  if (brand) chips.push({ label: brand.name, href: without({ brand: undefined, model: undefined }) });
  if (model) chips.push({ label: model.name, href: without({ model: undefined }) });
  if (filters.minPrice != null || filters.maxPrice != null) {
    chips.push({
      label: `${filters.minPrice != null ? formatPrice(filters.minPrice) : "0"} – ${filters.maxPrice != null ? formatPrice(filters.maxPrice) : "∞"}`,
      href: without({ minPrice: undefined, maxPrice: undefined }),
    });
  }
  if (filters.minYear != null || filters.maxYear != null) {
    chips.push({ label: `${filters.minYear ?? "…"} – ${filters.maxYear ?? "…"}`, href: without({ minYear: undefined, maxYear: undefined }) });
  }
  if (filters.condition) chips.push({ label: t.enums.condition[filters.condition], href: without({ condition: undefined }) });
  if (filters.fuelType) chips.push({ label: t.enums.fuelType[filters.fuelType], href: without({ fuelType: undefined }) });
  if (filters.transmission) chips.push({ label: t.enums.transmission[filters.transmission], href: without({ transmission: undefined }) });
  if (filters.district) chips.push({ label: districtName(filters.district, locale), href: without({ district: undefined, city: undefined }) });
  if (filters.city) chips.push({ label: cityName(filters.district, filters.city), href: without({ city: undefined }) });

  return (
    <Container className="py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {t.nav.home}
        </Link>
        <ChevronRight className="size-3.5" />
        {scope?.parent && (
          <>
            <Link href={`/category/${scope.parent.slug}`} className="hover:text-foreground">
              {categoryName(scope.parent, locale)}
            </Link>
            <ChevronRight className="size-3.5" />
          </>
        )}
        <span className="text-foreground">{catName ?? t.search.title}</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>

      {/* Subcategory shortcuts */}
      {scope && scope.ids.length > 1 && (
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {categories
            .find((c) => c.id === scope.category.id)
            ?.children.map((child) => (
              <Link
                key={child.id}
                href={searchHref({ ...filters, category: child.slug, page: 1 })}
                className="shrink-0 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium transition hover:border-accent-400 hover:text-accent-600"
              >
                {categoryName(child, locale)}
              </Link>
            ))}
        </div>
      )}

      <div className="mt-6 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <Card className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto p-5">
            <h2 className="mb-4 font-semibold">{t.search.filters}</h2>
            <SearchFilters key={searchHref(filters)} filters={filters} categories={categories} />
          </Card>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{adsCount(t, result.total)}</span>
            </p>
            <SearchToolbar key={searchHref(filters)} filters={filters} categories={categories} />
          </div>

          {chips.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pr-2 pl-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-200"
                >
                  {chip.label}
                  <X className="size-3.5" />
                </Link>
              ))}
              <Link href={searchHref({ q: filters.q, sort: filters.sort })} className="text-sm font-medium text-accent-600 hover:underline">
                {t.common.clearAll}
              </Link>
            </div>
          )}

          {result.ads.length ? (
            <AdGrid
              ads={result.ads}
              favouriteIds={favouriteIds}
              isLoggedIn={!!user}
              priorityCount={4}
              className="md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3"
            />
          ) : (
            <EmptyState icon={<SearchX className="size-6" />} title={t.search.noResultsTitle} text={t.search.noResultsText} />
          )}

          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            hrefFor={(page) => searchHref({ ...filters, page })}
            labels={{ previous: t.common.previous, next: t.common.next }}
          />
        </div>
      </div>
    </Container>
  );
}
