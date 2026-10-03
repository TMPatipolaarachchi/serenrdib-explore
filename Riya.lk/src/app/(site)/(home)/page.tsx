import Link from "next/link";
import { BadgeCheck, MessagesSquare, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { SectionHeading } from "@/components/home/section-heading";
import { AdGrid } from "@/components/ads/ad-grid";
import { Container, EmptyState } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth";
import { getCategoryTree } from "@/lib/categories";
import { getCategoryAdCounts, getFavouriteIds, getFeaturedAds, getLatestAds } from "@/lib/ads";
import { prisma } from "@/lib/prisma";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export default async function HomePage() {
  const [{ t }, user, categories, counts, featured, latest, banners] = await Promise.all([
    getI18n(),
    getCurrentUser(),
    getCategoryTree(),
    getCategoryAdCounts(),
    getFeaturedAds(8),
    getLatestAds(12),
    prisma.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const favouriteIds = await getFavouriteIds(user?.id);

  // Structured data: lets Google show a sitelinks search box.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Hero categories={categories} />

      <Container className="space-y-14 py-10 sm:space-y-20 sm:py-14">
        <section aria-labelledby="categories">
          <SectionHeading title={t.home.browseCategories} href="/search" linkLabel={t.common.viewAll} />
          <CategoryGrid categories={categories} counts={counts} />
        </section>

        {banners.length > 0 && <BannerCarousel banners={banners} />}

        <section>
          <SectionHeading title={t.home.featuredAds} subtitle={t.home.featuredSubtitle} href="/search" linkLabel={t.common.viewAll} />
          {featured.length ? (
            <AdGrid ads={featured} favouriteIds={favouriteIds} isLoggedIn={!!user} priorityCount={4} />
          ) : (
            <EmptyState icon={<Sparkles className="size-6" />} title={t.home.noFeatured} />
          )}
        </section>

        <section>
          <SectionHeading title={t.home.latestAds} subtitle={t.home.latestSubtitle} href="/search?sort=newest" linkLabel={t.common.viewAll} />
          {latest.length ? (
            <AdGrid ads={latest} favouriteIds={favouriteIds} isLoggedIn={!!user} />
          ) : (
            <EmptyState
              icon={<Plus className="size-6" />}
              title={t.home.noLatest}
              action={
                <Link href="/post-ad" className={buttonClass()}>
                  {t.nav.postFreeAd}
                </Link>
              }
            />
          )}
        </section>

        {/* Why Riya.lk */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: BadgeCheck, title: t.home.why1Title, text: t.home.why1Text },
            { icon: ShieldCheck, title: t.home.why2Title, text: t.home.why2Text },
            { icon: MessagesSquare, title: t.home.why3Title, text: t.home.why3Text },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-950/40 dark:text-accent-400">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Call to action */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500 to-accent-600 px-6 py-10 text-white shadow-xl shadow-accent-500/20 sm:px-12 sm:py-14">
          <div aria-hidden className="absolute -top-20 -right-20 size-72 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">{t.home.ctaTitle}</h2>
              <p className="mt-2 max-w-xl text-white/90">{t.home.ctaSubtitle}</p>
            </div>
            <Link
              href="/post-ad"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-white px-6 font-bold text-accent-600 shadow-lg transition hover:bg-accent-50 active:scale-[0.98]"
            >
              <Plus className="size-5" strokeWidth={2.5} />
              {t.home.ctaButton}
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
