"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, Clock, MapPin, Star, TrendingUp } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { FavouriteButton } from "./favourite-button";
import { useI18n } from "@/lib/i18n/client";
import { timeAgo } from "@/lib/i18n/config";
import { cityName, districtName } from "@/lib/data/locations";
import { cn, formatNumber, formatPrice } from "@/lib/utils";

/** Serializable subset of an ad needed for a card (see `adCardSelect`). */
export interface AdCardItem {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  negotiable: boolean;
  condition: string | null;
  district: string;
  city: string;
  year: number | null;
  mileage: number | null;
  fuelType: string | null;
  isFeatured: boolean;
  isTopAd: boolean;
  status: string;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  category: { slug: string; icon: string };
  images: { url: string }[];
  _count: { images: number };
}

export function AdCard({
  ad,
  saved = false,
  isLoggedIn = false,
  priority = false,
  index = 0,
}: {
  ad: AdCardItem;
  saved?: boolean;
  isLoggedIn?: boolean;
  priority?: boolean;
  index?: number;
}) {
  const { t, locale } = useI18n();
  const image = ad.images[0]?.url;
  const sold = ad.status === "SOLD";

  const specs = [
    ad.year,
    ad.mileage != null ? `${formatNumber(ad.mileage)} ${t.common.km}` : null,
    ad.fuelType ? t.enums.fuelType[ad.fuelType as keyof typeof t.enums.fuelType] : null,
  ].filter(Boolean);

  return (
    <article
      // Above-the-fold cards render immediately (better LCP); the rest rise in, staggered.
      style={priority ? undefined : { animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className={cn(
        !priority && "animate-rise",
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/10",
        ad.isTopAd ? "border-accent-300 ring-1 ring-accent-200 dark:border-accent-800 dark:ring-accent-900/50" : "border-border",
      )}
    >
      <Link href={`/ads/${ad.slug}`} className="absolute inset-0 z-10" aria-label={ad.title} />

      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image}
            alt={ad.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn("object-cover transition-transform duration-500 group-hover:scale-105", sold && "grayscale")}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 text-brand-300 dark:from-brand-950 dark:to-slate-900 dark:text-brand-800">
            <CategoryIcon icon={ad.category.icon} className="size-14" strokeWidth={1.4} />
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          {ad.isTopAd && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-bold text-white shadow">
              <TrendingUp className="size-3" /> {t.common.topAd}
            </span>
          )}
          {ad.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-900/90 px-2 py-0.5 text-[11px] font-bold text-white shadow backdrop-blur">
              <Star className="size-3 fill-current" /> {t.common.featured}
            </span>
          )}
        </div>

        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
            <span className="-rotate-6 rounded-lg border-2 border-white px-3 py-1 text-lg font-extrabold tracking-widest text-white uppercase">
              {t.enums.status.SOLD}
            </span>
          </div>
        )}

        {ad._count.images > 1 && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-slate-950/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
            <Camera className="size-3" /> {ad._count.images}
          </span>
        )}

        <div className="absolute top-2 right-2 z-20">
          <FavouriteButton adId={ad.id} initialSaved={saved} isLoggedIn={isLoggedIn} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-foreground group-hover:text-brand-700 sm:text-[15px] dark:group-hover:text-brand-300">
          {ad.title}
        </h3>

        {specs.length > 0 && <p className="mt-1 truncate text-xs text-muted-foreground">{specs.join(" • ")}</p>}

        <div className="mt-auto pt-2.5">
          <p className="text-base font-extrabold text-accent-600 sm:text-lg dark:text-accent-400">
            {ad.price != null ? formatPrice(ad.price) : t.common.priceOnRequest}
          </p>
          {ad.negotiable && <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{t.common.negotiable}</p>}
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground sm:text-xs">
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">
                {cityName(ad.district, ad.city)}, {districtName(ad.district, locale)}
              </span>
            </span>
            <span className="hidden shrink-0 items-center gap-1 sm:flex" suppressHydrationWarning>
              <Clock className="size-3" />
              {timeAgo(ad.publishedAt ?? ad.createdAt, locale)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Loading placeholder with the same footprint as an AdCard. */
export function AdCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-4 w-11/12 rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton mt-4 h-5 w-1/2 rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
      </div>
    </div>
  );
}
