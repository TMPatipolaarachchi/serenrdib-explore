"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { SearchFilters, type FilterCategory } from "./search-filters";
import { useI18n } from "@/lib/i18n/client";
import { SORT_OPTIONS, type SortOption } from "@/lib/constants";
import { activeFilterCount, searchHref, type AdFilters } from "@/lib/search-params";

/** Results toolbar: sort dropdown + (on phones) a "Filters" button that opens a bottom sheet. */
export function SearchToolbar({ filters, categories }: { filters: AdFilters; categories: FilterCategory[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const count = activeFilterCount(filters);

  function sortBy(sort: SortOption) {
    startTransition(() => router.push(searchHref({ ...filters, sort, page: 1 })));
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-semibold transition hover:bg-muted lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        {t.search.filters}
        {count > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-accent-500 text-[11px] font-bold text-white">{count}</span>
        )}
      </button>

      <label className="relative inline-flex items-center">
        <ArrowUpDown className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
        <span className="sr-only">{t.search.sortBy}</span>
        <select
          value={filters.sort}
          onChange={(e) => sortBy(e.target.value as SortOption)}
          disabled={pending}
          className="h-10 cursor-pointer appearance-none rounded-xl border border-border bg-card pr-4 pl-9 text-sm font-medium transition hover:bg-muted focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {t.search.sort[s]}
            </option>
          ))}
        </select>
      </label>

      <Modal open={open} onClose={() => setOpen(false)} title={t.search.filters}>
        <SearchFilters filters={filters} categories={categories} mode="sheet" onApplied={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
