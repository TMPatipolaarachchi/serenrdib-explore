"use client";

/**
 * Search filter panel.
 *  • "sidebar" mode (desktop): selects apply instantly, number inputs on blur/Enter.
 *  • "sheet" mode (phones): changes are collected and applied with "Show results".
 * Filters live in the URL, so results are shareable and SEO-friendly.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { categoryName } from "@/lib/i18n/config";
import { DISTRICTS, citySlug, getDistrict } from "@/lib/data/locations";
import { CONDITIONS, FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants";
import { searchHref, type AdFilters } from "@/lib/search-params";
import { useCatalog } from "@/lib/use-catalog";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameSi: string;
  nameTa: string;
  type: string;
  children: { id: string; slug: string; nameEn: string; nameSi: string; nameTa: string; type: string }[];
}

type Draft = Partial<AdFilters>;

export function SearchFilters({
  filters,
  categories,
  mode = "sidebar",
  onApplied,
}: {
  filters: AdFilters;
  categories: FilterCategory[];
  mode?: "sidebar" | "sheet";
  onApplied?: () => void;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft>(filters);

  const allCategories = categories.flatMap((c) => [c, ...c.children]);
  const selectedCategory = allCategories.find((c) => c.slug === draft.category);
  const type = selectedCategory?.type;
  const showVehicleFields = !type || type === "VEHICLE";
  const showBrand = type !== "SERVICE";
  const showCondition = type !== "SERVICE";

  const brands = useCatalog(showBrand ? `/api/catalog/brands${draft.category ? `?category=${draft.category}` : ""}` : null);
  const models = useCatalog(
    draft.brand ? `/api/catalog/models?brand=${draft.brand}${draft.category ? `&category=${draft.category}` : ""}` : null,
  );
  const district = getDistrict(draft.district);

  function navigate(next: Draft) {
    startTransition(() => {
      router.push(searchHref({ ...next, sort: filters.sort, page: 1 }), { scroll: mode === "sheet" });
    });
    onApplied?.();
  }

  /** Updates the draft; in sidebar mode `instant` changes are applied right away. */
  function update(patch: Draft, instant = true) {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (mode === "sidebar" && instant) navigate(next);
  }

  const numberValue = (v: number | undefined) => (v == null ? "" : String(v));
  const parseNum = (v: string) => (v.trim() === "" ? undefined : Math.max(0, Number.parseInt(v.replace(/\D/g, ""), 10) || 0));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate(draft);
      }}
      className={cn("space-y-5", pending && "opacity-70 transition-opacity")}
    >
      <Field label={t.search.keyword} htmlFor="f-q">
        <Input
          id="f-q"
          value={draft.q ?? ""}
          onChange={(e) => update({ q: e.target.value || undefined }, false)}
          onBlur={() => mode === "sidebar" && draft.q !== filters.q && navigate(draft)}
          placeholder={t.home.searchPlaceholder}
        />
      </Field>

      <Field label={t.search.category} htmlFor="f-category">
        <Select
          id="f-category"
          value={draft.category ?? ""}
          onChange={(e) => update({ category: e.target.value || undefined, brand: undefined, model: undefined })}
        >
          <option value="">{t.nav.allCategories}</option>
          {categories.map((c) =>
            c.children.length ? (
              <optgroup key={c.id} label={categoryName(c, locale)}>
                <option value={c.slug}>
                  {categoryName(c, locale)} — {t.common.all}
                </option>
                {c.children.map((child) => (
                  <option key={child.id} value={child.slug}>
                    {categoryName(child, locale)}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={c.id} value={c.slug}>
                {categoryName(c, locale)}
              </option>
            ),
          )}
        </Select>
      </Field>

      {showBrand && (
        <div className="grid gap-5">
          <Field label={t.search.brand} htmlFor="f-brand">
            <Select
              id="f-brand"
              value={draft.brand ?? ""}
              onChange={(e) => update({ brand: e.target.value || undefined, model: undefined })}
              disabled={!brands}
            >
              <option value="">{t.search.anyBrand}</option>
              {brands?.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.search.model} htmlFor="f-model">
            <Select
              id="f-model"
              value={draft.model ?? ""}
              onChange={(e) => update({ model: e.target.value || undefined })}
              disabled={!draft.brand || !models}
            >
              <option value="">{t.search.anyModel}</option>
              {models?.map((m) => (
                <option key={m.id} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">{t.search.priceRange}</legend>
        <div className="grid grid-cols-2 gap-3">
          <Input
            inputMode="numeric"
            aria-label={`${t.search.priceRange} ${t.search.min}`}
            placeholder={t.search.min}
            value={numberValue(draft.minPrice)}
            onChange={(e) => update({ minPrice: parseNum(e.target.value) }, false)}
            onBlur={() => mode === "sidebar" && draft.minPrice !== filters.minPrice && navigate(draft)}
          />
          <Input
            inputMode="numeric"
            aria-label={`${t.search.priceRange} ${t.search.max}`}
            placeholder={t.search.max}
            value={numberValue(draft.maxPrice)}
            onChange={(e) => update({ maxPrice: parseNum(e.target.value) }, false)}
            onBlur={() => mode === "sidebar" && draft.maxPrice !== filters.maxPrice && navigate(draft)}
          />
        </div>
      </fieldset>

      {showVehicleFields && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">{t.search.year}</legend>
          <div className="grid grid-cols-2 gap-3">
            <Input
              inputMode="numeric"
              aria-label={`${t.search.year} ${t.search.min}`}
              placeholder={t.search.min}
              value={numberValue(draft.minYear)}
              onChange={(e) => update({ minYear: parseNum(e.target.value) }, false)}
              onBlur={() => mode === "sidebar" && draft.minYear !== filters.minYear && navigate(draft)}
            />
            <Input
              inputMode="numeric"
              aria-label={`${t.search.year} ${t.search.max}`}
              placeholder={t.search.max}
              value={numberValue(draft.maxYear)}
              onChange={(e) => update({ maxYear: parseNum(e.target.value) }, false)}
              onBlur={() => mode === "sidebar" && draft.maxYear !== filters.maxYear && navigate(draft)}
            />
          </div>
        </fieldset>
      )}

      {showCondition && (
        <Field label={t.search.condition}>
          <div className="flex flex-wrap gap-2">
            {[undefined, ...CONDITIONS].map((c) => (
              <button
                key={c ?? "any"}
                type="button"
                onClick={() => update({ condition: c })}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                  draft.condition === c
                    ? "border-brand-700 bg-brand-900 text-white dark:border-brand-500 dark:bg-brand-600"
                    : "border-border bg-card hover:border-brand-300",
                )}
              >
                {c ? t.enums.condition[c] : t.common.any}
              </button>
            ))}
          </div>
        </Field>
      )}

      {showVehicleFields && (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.search.fuelType} htmlFor="f-fuel">
            <Select id="f-fuel" value={draft.fuelType ?? ""} onChange={(e) => update({ fuelType: (e.target.value || undefined) as Draft["fuelType"] })}>
              <option value="">{t.common.any}</option>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {t.enums.fuelType[f]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.search.transmission} htmlFor="f-trans">
            <Select
              id="f-trans"
              value={draft.transmission ?? ""}
              onChange={(e) => update({ transmission: (e.target.value || undefined) as Draft["transmission"] })}
            >
              <option value="">{t.common.any}</option>
              {TRANSMISSIONS.map((tr) => (
                <option key={tr} value={tr}>
                  {t.enums.transmission[tr]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      <Field label={t.search.district} htmlFor="f-district">
        <Select id="f-district" value={draft.district ?? ""} onChange={(e) => update({ district: e.target.value || undefined, city: undefined })}>
          <option value="">{t.search.allDistricts}</option>
          {DISTRICTS.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name[locale]}
            </option>
          ))}
        </Select>
      </Field>

      {district && (
        <Field label={t.search.city} htmlFor="f-city">
          <Select id="f-city" value={draft.city ?? ""} onChange={(e) => update({ city: e.target.value || undefined })}>
            <option value="">{t.search.allCities}</option>
            {district.cities.map((c) => (
              <option key={c} value={citySlug(c)}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className={cn("flex gap-3", mode === "sheet" ? "sticky bottom-0 bg-card pt-2 pb-1" : "")}>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            const cleared: Draft = { q: filters.q };
            setDraft(cleared);
            navigate(cleared);
          }}
        >
          {t.search.clearFilters}
        </Button>
        {mode === "sheet" ? (
          <Button type="submit" className="flex-1" loading={pending}>
            {t.search.showResults}
          </Button>
        ) : (
          <Button type="submit" variant="secondary" className="flex-1" loading={pending}>
            {t.common.apply}
          </Button>
        )}
      </div>
    </form>
  );
}
