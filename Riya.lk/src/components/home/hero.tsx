"use client";

import Link from "next/link";
import Form from "next/form";
import { LayoutGrid, MapPin, Search, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { categoryName } from "@/lib/i18n/config";
import { DISTRICTS } from "@/lib/data/locations";

interface HeroCategory {
  slug: string;
  nameEn: string;
  nameSi: string;
  nameTa: string;
}

const POPULAR = ["Toyota Aqua", "Honda Vezel", "Wagon R", "Bajaj RE", "Yamaha FZ", "KDH"];

/** Homepage hero with the main search bar. */
export function Hero({ categories }: { categories: HeroCategory[] }) {
  const { t, locale } = useI18n();

  const fieldClass =
    "h-12 w-full appearance-none rounded-xl bg-transparent pr-3 pl-10 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-white";

  return (
    <section className="relative isolate overflow-hidden bg-brand-950 text-white">
      {/* Decorative background: gradient glows + faint grid */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800" />
        <div className="absolute -top-32 -right-24 size-[28rem] rounded-full bg-accent-500/25 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 size-[26rem] rounded-full bg-brand-500/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-3xl animate-rise text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-brand-100 backdrop-blur">
            <ShieldCheck className="size-3.5 text-accent-400" />
            {t.home.heroBadge}
          </span>
          <h1 className="mt-5 text-4xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {t.home.heroTitle}{" "}
            <span className="bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent">
              {t.home.heroHighlight}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-brand-100/90 sm:text-lg">{t.home.heroSubtitle}</p>
        </div>

        <div className="mx-auto mt-9 max-w-4xl animate-rise [animation-delay:120ms]">
          <Form
            action="/search"
            role="search"
            className="grid gap-1 rounded-2xl bg-white p-2 shadow-2xl shadow-brand-950/50 sm:grid-cols-[1.6fr_1fr_1fr_auto] sm:gap-0 sm:divide-x sm:divide-slate-200 dark:bg-card dark:sm:divide-border"
          >
            <label className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 size-5 text-slate-400" aria-hidden />
              <input name="q" placeholder={t.home.searchPlaceholder} aria-label={t.search.keyword} className={fieldClass} />
            </label>
            <label className="relative flex items-center border-t border-slate-100 sm:border-t-0 dark:border-border">
              <LayoutGrid className="pointer-events-none absolute left-3 size-5 text-slate-400" aria-hidden />
              <select name="category" aria-label={t.search.category} className={`${fieldClass} cursor-pointer`} defaultValue="">
                <option value="">{t.nav.allCategories}</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {categoryName(c, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className="relative flex items-center border-t border-slate-100 sm:border-t-0 dark:border-border">
              <MapPin className="pointer-events-none absolute left-3 size-5 text-slate-400" aria-hidden />
              <select name="district" aria-label={t.search.district} className={`${fieldClass} cursor-pointer`} defaultValue="">
                <option value="">{t.home.allOfSriLanka}</option>
                {DISTRICTS.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name[locale]}
                  </option>
                ))}
              </select>
            </label>
            <div className="pt-1 sm:pt-0 sm:pl-2">
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-7 font-semibold text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-600 active:scale-[0.98]"
              >
                <Search className="size-5" />
                {t.common.search}
              </button>
            </div>
          </Form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-brand-200/80">{t.home.popular}</span>
            {POPULAR.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-brand-50 transition hover:border-accent-400 hover:bg-accent-500/20"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
