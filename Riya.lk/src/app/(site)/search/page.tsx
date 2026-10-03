import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SearchView } from "@/components/search/search-view";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { parseAdFilters, searchHref } from "@/lib/search-params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseAdFilters(await searchParams);
  const { t } = await getI18n();
  const hasFilters = Object.keys(await searchParams).length > 0;
  return {
    title: filters.q ? fmt(t.search.resultsFor, { q: filters.q }) : t.search.title,
    alternates: { canonical: "/search" },
    // Filtered result pages are thin/duplicate content — keep them out of the index.
    robots: hasFilters ? { index: false, follow: true } : undefined,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const filters = parseAdFilters(await searchParams);
  // A chosen category gets its own SEO-friendly URL: /category/<slug>
  if (filters.category) redirect(searchHref(filters));
  return <SearchView filters={filters} />;
}
