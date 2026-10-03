"use client";

import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { useI18n } from "@/lib/i18n/client";
import { adsCount, categoryName } from "@/lib/i18n/config";

interface GridCategory {
  slug: string;
  nameEn: string;
  nameSi: string;
  nameTa: string;
  icon: string;
}

/** Tappable category tiles with ad counts. */
export function CategoryGrid({ categories, counts }: { categories: GridCategory[]; counts: Record<string, number> }) {
  const { locale, t } = useI18n();

  return (
    <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-4 lg:grid-cols-7">
      {categories.map((c, i) => (
        <li key={c.slug} className="animate-rise" style={{ animationDelay: `${i * 35}ms` }}>
          <Link
            href={`/category/${c.slug}`}
            className="group flex h-full flex-col items-center gap-2.5 rounded-2xl border border-border bg-card px-2 py-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-lg hover:shadow-accent-500/10 sm:py-5 dark:hover:border-accent-700"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-accent-500 group-hover:text-white sm:size-14 dark:bg-brand-950 dark:text-brand-300">
              <CategoryIcon icon={c.icon} className="size-6 sm:size-7" strokeWidth={1.8} />
            </span>
            <span className="line-clamp-2 text-xs leading-tight font-semibold sm:text-sm">{categoryName(c, locale)}</span>
            <span className="text-[11px] text-muted-foreground">{adsCount(t, counts[c.slug] ?? 0)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
