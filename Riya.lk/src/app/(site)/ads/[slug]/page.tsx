import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { BadgeCheck, ChevronRight, Clock, Eye, MapPin, Pencil, ShieldAlert, Star, TrendingUp } from "lucide-react";
import { AdGallery } from "@/components/ads/ad-gallery";
import { ContactActions } from "@/components/ads/contact-actions";
import { FavouriteButton } from "@/components/ads/favourite-button";
import { ReportButton } from "@/components/ads/report-button";
import { ShareButton } from "@/components/ads/share-button";
import { AdGrid } from "@/components/ads/ad-grid";
import { SectionHeading } from "@/components/home/section-heading";
import { Avatar, Badge, Card, Container } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PUBLIC_AD_STATUSES, getAdDetail as getAd, getFavouriteIds, getSimilarAds } from "@/lib/ads";
import { getI18n } from "@/lib/i18n/server";
import { categoryName, fmt, formatDate, timeAgo } from "@/lib/i18n/config";
import { cityName, districtName } from "@/lib/data/locations";
import { absoluteUrl, formatNumber, formatPrice, truncate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ad = await getAd(slug);
  if (!ad) return {};
  const { locale, t } = await getI18n();
  const price = ad.price != null ? formatPrice(ad.price) : t.common.priceOnRequest;
  const place = `${cityName(ad.district, ad.city)}, ${districtName(ad.district, locale)}`;
  const description = truncate(`${price} · ${place}. ${ad.description.replace(/\s+/g, " ")}`, 160);
  const image = ad.images[0]?.url;

  return {
    title: `${ad.title} – ${price}`,
    description,
    alternates: { canonical: `/ads/${ad.slug}` },
    robots: PUBLIC_AD_STATUSES.has(ad.status) ? undefined : { index: false, follow: false },
    openGraph: {
      type: "website",
      title: ad.title,
      description,
      url: `/ads/${ad.slug}`,
      images: image ? [{ url: image, alt: ad.title }] : undefined,
    },
  };
}

export default async function AdPage({ params }: Props) {
  const { slug } = await params;
  const [ad, user, { locale, t }] = await Promise.all([getAd(slug), getCurrentUser(), getI18n()]);
  if (!ad) notFound();

  const isOwner = user?.id === ad.userId;
  const isPublic = PUBLIC_AD_STATUSES.has(ad.status);
  // Pending/rejected ads are only visible to their owner (also enforced in layout.tsx).
  if (!isPublic && !isOwner) notFound();

  // Count the view after the response is sent (owners don't count).
  if (isPublic && !isOwner) {
    after(() => prisma.ad.update({ where: { id: ad.id }, data: { views: { increment: 1 } } }).catch(() => {}));
  }

  const [similar, favouriteIds] = await Promise.all([getSimilarAds(ad, 8), getFavouriteIds(user?.id)]);
  const url = absoluteUrl(`/ads/${ad.slug}`);
  const type = ad.category.type;
  const modelName = ad.model?.name ?? ad.modelText;

  const specs: { label: string; value: string | null | undefined }[] = [
    { label: t.ad.category, value: categoryName(ad.category, locale) },
    { label: t.ad.condition, value: ad.condition ? t.enums.condition[ad.condition] : null },
    { label: type === "VEHICLE" ? t.ad.brand : t.ad.compatibleWith, value: [ad.brand?.name, modelName].filter(Boolean).join(" ") || null },
    ...(type === "VEHICLE" ? [{ label: t.ad.model, value: modelName }] : []),
    { label: t.ad.year, value: ad.year?.toString() },
    { label: t.ad.mileage, value: ad.mileage != null ? `${formatNumber(ad.mileage)} ${t.common.km}` : null },
    { label: t.ad.fuelType, value: ad.fuelType ? t.enums.fuelType[ad.fuelType] : null },
    { label: t.ad.transmission, value: ad.transmission ? t.enums.transmission[ad.transmission] : null },
    { label: t.ad.engineCapacity, value: ad.engineCapacity ? `${formatNumber(ad.engineCapacity)} ${t.common.cc}` : null },
    { label: t.ad.partNumber, value: ad.partNumber },
    { label: t.ad.compatibility, value: ad.compatibility },
  ].filter((s) => s.value);

  // Structured data for rich results in Google.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": type === "VEHICLE" ? "Vehicle" : "Product",
    name: ad.title,
    description: truncate(ad.description, 500),
    image: ad.images.map((i) => i.url),
    url,
    category: ad.category.nameEn,
    ...(ad.brand ? { brand: { "@type": "Brand", name: ad.brand.name } } : {}),
    ...(type === "VEHICLE"
      ? {
          model: modelName ?? undefined,
          vehicleModelDate: ad.year?.toString(),
          mileageFromOdometer: ad.mileage != null ? { "@type": "QuantitativeValue", value: ad.mileage, unitCode: "KMT" } : undefined,
          fuelType: ad.fuelType ?? undefined,
          vehicleTransmission: ad.transmission ?? undefined,
        }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      price: ad.price ?? undefined,
      availability: ad.status === "SOLD" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      itemCondition:
        ad.condition === "NEW" ? "https://schema.org/NewCondition" : ad.condition === "RECONDITIONED" ? "https://schema.org/RefurbishedCondition" : "https://schema.org/UsedCondition",
      areaServed: districtName(ad.district, "en"),
    },
  };

  return (
    <Container className="py-5 sm:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {t.nav.home}
        </Link>
        {ad.category.parent && (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={`/category/${ad.category.parent.slug}`} className="hover:text-foreground">
              {categoryName(ad.category.parent, locale)}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5" />
        <Link href={`/category/${ad.category.slug}`} className="hover:text-foreground">
          {categoryName(ad.category, locale)}
        </Link>
      </nav>

      {/* Status notices */}
      {ad.status === "PENDING" && <Notice tone="amber">{t.ad.pendingNotice}</Notice>}
      {ad.status === "REJECTED" && <Notice tone="red">{fmt(t.ad.rejectedNotice, { reason: ad.rejectionReason ?? "—" })}</Notice>}
      {ad.status === "SOLD" && <Notice tone="slate">{t.ad.soldNotice}</Notice>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        {/* A. Gallery */}
        <div className="lg:col-start-1 lg:row-start-1">
          <AdGallery images={ad.images} title={ad.title} icon={ad.category.icon} />
        </div>

        {/* B. Summary + contact */}
        <Card className="h-fit p-5 sm:p-6 lg:col-start-2 lg:row-start-1">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {ad.isTopAd && (
              <Badge tone="solidAccent">
                <TrendingUp className="size-3" /> {t.common.topAd}
              </Badge>
            )}
            {ad.isFeatured && (
              <Badge tone="solidBrand">
                <Star className="size-3 fill-current" /> {t.common.featured}
              </Badge>
            )}
            {ad.condition && <Badge tone="brand">{t.enums.condition[ad.condition]}</Badge>}
            {ad.status !== "ACTIVE" && <Badge tone={ad.status === "REJECTED" ? "danger" : "warning"}>{t.enums.status[ad.status]}</Badge>}
          </div>

          <h1 className="text-xl leading-snug font-bold tracking-tight sm:text-2xl">{ad.title}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-3xl font-extrabold text-accent-600 dark:text-accent-400">
              {ad.price != null ? formatPrice(ad.price) : t.common.priceOnRequest}
            </p>
            {ad.negotiable && <Badge tone="success">{t.common.negotiable}</Badge>}
          </div>

          <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              {cityName(ad.district, ad.city)}, {districtName(ad.district, locale)}
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 shrink-0" />
              {fmt(t.ad.postedOn, { date: timeAgo(ad.publishedAt ?? ad.createdAt, locale) })}
            </li>
            <li className="flex items-center gap-2">
              <Eye className="size-4 shrink-0" />
              {ad.views === 1 ? t.common.viewsOne : fmt(t.common.views, { count: formatNumber(ad.views) })}
            </li>
          </ul>

          <div className="mt-5">
            {isOwner ? (
              <div className="space-y-2.5 rounded-2xl bg-brand-50 p-4 dark:bg-brand-950/50">
                <p className="text-sm font-semibold text-brand-800 dark:text-brand-200">{t.ad.yourAd}</p>
                {ad.status !== "SOLD" && (
                  <Link href={`/my-ads/${ad.id}/edit`} className={buttonClass({ variant: "secondary", className: "w-full" })}>
                    <Pencil className="size-4" />
                    {t.ad.editAd}
                  </Link>
                )}
                <Link href="/my-ads" className={buttonClass({ variant: "outline", className: "w-full" })}>
                  {t.nav.myAds}
                </Link>
              </div>
            ) : (
              <ContactActions
                adId={ad.id}
                adTitle={ad.title}
                adUrl={url}
                phone={ad.contactPhone}
                isOwner={isOwner}
                isLoggedIn={!!user}
                canContact={ad.status === "ACTIVE"}
              />
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <FavouriteButton adId={ad.id} initialSaved={favouriteIds.includes(ad.id)} isLoggedIn={!!user} variant="button" className="h-10" />
            <div className="flex flex-wrap items-center gap-4">
              <ShareButton title={ad.title} url={url} />
              {!isOwner && <ReportButton adId={ad.id} isLoggedIn={!!user} />}
            </div>
          </div>
        </Card>

        {/* C. Details + description */}
        <div className="space-y-5 lg:col-start-1 lg:row-start-2">
          {specs.length > 0 && (
            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-bold">{t.ad.details}</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {specs.map((s) => (
                  <div key={s.label} className={s.label === t.ad.compatibility ? "col-span-2 sm:col-span-3" : undefined}>
                    <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{s.label}</dt>
                    <dd className="mt-0.5 font-semibold">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          <Card className="p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-bold">{t.ad.description}</h2>
            <p className="leading-relaxed break-words whitespace-pre-line text-foreground/90">{ad.description}</p>
            <p className="mt-5 text-xs text-muted-foreground">
              {t.ad.adId}: {ad.id}
            </p>
          </Card>
        </div>

        {/* D. Seller + safety */}
        <div className="space-y-5 lg:col-start-2 lg:row-start-2">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">{t.ad.seller}</h2>
            <div className="flex items-center gap-3">
              <Avatar name={ad.contactName ?? ad.user.name} src={ad.user.image} size={48} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{ad.contactName ?? ad.user.name}</p>
                <p className="text-xs text-muted-foreground">{fmt(t.ad.memberSince, { date: formatDate(ad.user.createdAt, locale) })}</p>
                {ad.user.phoneVerifiedAt && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="size-3.5" /> {t.ad.verifiedPhone}
                  </p>
                )}
              </div>
            </div>
            <Link href={`/sellers/${ad.user.id}`} className={buttonClass({ variant: "outline", size: "sm", className: "mt-4 w-full" })}>
              {t.ad.viewSellerAds}
            </Link>
          </Card>

          <Card className="border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
              <ShieldAlert className="size-5" /> {t.ad.safetyTitle}
            </h2>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-amber-900/80 dark:text-amber-100/80">
              {t.ad.safetyTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <SectionHeading title={t.ad.similarAds} href={`/category/${ad.category.slug}`} linkLabel={t.common.viewAll} />
          <AdGrid ads={similar} favouriteIds={favouriteIds} isLoggedIn={!!user} />
        </section>
      )}
    </Container>
  );
}

function Notice({ tone, children }: { tone: "amber" | "red" | "slate"; children: React.ReactNode }) {
  const tones = {
    amber: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
    red: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200",
    slate: "border-border bg-muted text-foreground",
  };
  return <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${tones[tone]}`}>{children}</div>;
}
