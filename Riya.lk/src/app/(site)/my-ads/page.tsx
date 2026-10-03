import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Eye, LayoutGrid, Plus } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { MyAdActions } from "@/components/ads/my-ad-actions";
import { Badge, Card, Container, EmptyState, PageHeader, type BadgeTone } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { fmt, timeAgo } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import { cn, firstParam, formatNumber, formatPrice } from "@/lib/utils";
import type { AdStatus } from "@/lib/constants";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TABS = ["all", "ACTIVE", "PENDING", "SOLD", "REJECTED"] as const;
const STATUS_TONE: Record<AdStatus, BadgeTone> = {
  ACTIVE: "success",
  PENDING: "warning",
  SOLD: "neutral",
  REJECTED: "danger",
  EXPIRED: "neutral",
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.myAds.title, robots: { index: false } };
}

export default async function MyAdsPage({ searchParams }: Props) {
  const user = await requireUser("/my-ads");
  const { locale, t } = await getI18n();
  const raw = firstParam((await searchParams).status);
  const tab = (TABS as readonly string[]).includes(raw ?? "") ? (raw as (typeof TABS)[number]) : "all";

  const [ads, counts] = await Promise.all([
    prisma.ad.findMany({
      where: { userId: user.id, ...(tab !== "all" ? { status: tab } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { icon: true } },
      },
    }),
    prisma.ad.groupBy({ by: ["status"], where: { userId: user.id }, _count: { _all: true } }),
  ]);
  const countFor = (s: string) =>
    s === "all" ? counts.reduce((n, c) => n + c._count._all, 0) : (counts.find((c) => c.status === s)?._count._all ?? 0);

  return (
    <Container className="py-6 sm:py-10">
      <PageHeader
        title={t.myAds.title}
        subtitle={t.myAds.subtitle}
        action={
          <Link href="/post-ad" className={buttonClass()}>
            <Plus className="size-4" strokeWidth={2.5} /> {t.nav.postAd}
          </Link>
        }
      />

      <nav className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label={t.myAds.title}>
        {TABS.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/my-ads" : `/my-ads?status=${s}`}
            aria-current={tab === s ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === s ? "bg-brand-900 text-white dark:bg-brand-600" : "border border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {t.myAds.tabs[s]}
            <span className={cn("rounded-full px-1.5 text-xs", tab === s ? "bg-white/20" : "bg-muted")}>{countFor(s)}</span>
          </Link>
        ))}
      </nav>

      {ads.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="size-6" />}
          title={t.myAds.emptyTitle}
          text={t.myAds.emptyText}
          action={
            <Link href="/post-ad" className={buttonClass()}>
              {t.myAds.postFirst}
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <Card key={ad.id} className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:p-4">
              <Link href={`/ads/${ad.slug}`} className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-40">
                {ad.images[0] ? (
                  <Image src={ad.images[0].url} alt={ad.title} fill sizes="(max-width: 640px) 100vw, 160px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-brand-300 dark:text-brand-800">
                    <CategoryIcon icon={ad.category.icon} className="size-10" />
                  </div>
                )}
              </Link>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONE[ad.status]}>{t.enums.status[ad.status]}</Badge>
                  {ad.isFeatured && <Badge tone="brand">{t.common.featured}</Badge>}
                  {ad.isTopAd && <Badge tone="accent">{t.common.topAd}</Badge>}
                </div>
                <Link href={`/ads/${ad.slug}`} className="line-clamp-1 font-semibold hover:text-brand-700 dark:hover:text-brand-300">
                  {ad.title}
                </Link>
                <p className="font-bold text-accent-600 dark:text-accent-400">
                  {ad.price != null ? formatPrice(ad.price) : t.common.priceOnRequest}
                </p>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {timeAgo(ad.createdAt, locale)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-3.5" /> {ad.views === 1 ? t.common.viewsOne : fmt(t.common.views, { count: formatNumber(ad.views) })}
                  </span>
                </p>
                {ad.status === "REJECTED" && ad.rejectionReason && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    {fmt(t.myAds.rejectionReason, { reason: ad.rejectionReason })}
                  </p>
                )}
              </div>

              <div className="sm:self-center">
                <MyAdActions id={ad.id} slug={ad.slug} status={ad.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
