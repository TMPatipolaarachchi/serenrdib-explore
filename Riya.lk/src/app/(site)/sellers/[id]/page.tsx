import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Store } from "lucide-react";
import { AdGrid } from "@/components/ads/ad-grid";
import { Avatar, Card, Container, EmptyState } from "@/components/ui/misc";
import { getCurrentUser } from "@/lib/auth";
import { adCardSelect, getFavouriteIds } from "@/lib/ads";
import { getI18n } from "@/lib/i18n/server";
import { fmt, formatDate } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

async function getSeller(id: string) {
  return prisma.user.findFirst({
    where: { id, status: "ACTIVE" },
    select: { id: true, name: true, image: true, createdAt: true, phoneVerifiedAt: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const seller = await getSeller((await params).id);
  if (!seller) return {};
  const { t } = await getI18n();
  return { title: fmt(t.seller.adsBy, { name: seller.name }) };
}

/** Public seller page listing their active ads. */
export default async function SellerPage({ params }: Props) {
  const { id } = await params;
  const [seller, viewer, { locale, t }] = await Promise.all([getSeller(id), getCurrentUser(), getI18n()]);
  if (!seller) notFound();

  const [ads, favouriteIds] = await Promise.all([
    prisma.ad.findMany({
      where: { userId: seller.id, status: "ACTIVE" },
      orderBy: { publishedAt: "desc" },
      take: 60,
      select: adCardSelect,
    }),
    getFavouriteIds(viewer?.id),
  ]);

  return (
    <Container className="py-6 sm:py-10">
      <Card className="mb-8 flex items-center gap-4 p-6">
        <Avatar name={seller.name} src={seller.image} size={72} />
        <div>
          <h1 className="text-2xl font-bold">{seller.name}</h1>
          <p className="text-sm text-muted-foreground">{fmt(t.ad.memberSince, { date: formatDate(seller.createdAt, locale) })}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium">{ads.length === 1 ? t.seller.activeAdsOne : fmt(t.seller.activeAds, { count: ads.length })}</span>
            {seller.phoneVerifiedAt && (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="size-4" /> {t.ad.verifiedPhone}
              </span>
            )}
          </div>
        </div>
      </Card>

      {ads.length ? (
        <AdGrid ads={ads} favouriteIds={favouriteIds} isLoggedIn={!!viewer} />
      ) : (
        <EmptyState icon={<Store className="size-6" />} title={t.seller.noAds} />
      )}
    </Container>
  );
}
