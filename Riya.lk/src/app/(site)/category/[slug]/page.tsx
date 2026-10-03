import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchView } from "@/components/search/search-view";
import { getI18n } from "@/lib/i18n/server";
import { categoryName, fmt } from "@/lib/i18n/config";
import { getCategoryScope } from "@/lib/categories";
import { parseAdFilters } from "@/lib/search-params";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const scope = await getCategoryScope(slug);
  if (!scope) return {};
  const { locale, t } = await getI18n();
  const name = categoryName(scope.category, locale);
  const hasFilters = Object.keys(await searchParams).length > 0;
  return {
    title: fmt(t.search.inCategory, { category: name }),
    description: `${fmt(t.search.inCategory, { category: name })}. ${t.meta.description}`,
    alternates: { canonical: `/category/${slug}` },
    robots: hasFilters ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  if (!(await getCategoryScope(slug))) notFound();
  const filters = parseAdFilters({ ...(await searchParams), category: slug });
  return <SearchView filters={filters} />;
}
