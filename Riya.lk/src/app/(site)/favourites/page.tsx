import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { AdGrid } from "@/components/ads/ad-grid";
import { Container, EmptyState, PageHeader } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { adCardSelect } from "@/lib/ads";
import { getI18n } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.favourites.title, robots: { index: false } };
}

export default async function FavouritesPage() {
  const user = await requireUser("/favourites");
  const { t } = await getI18n();

  const favourites = await prisma.favourite.findMany({
    where: { userId: user.id, ad: { status: { in: ["ACTIVE", "SOLD"] } } },
    orderBy: { createdAt: "desc" },
    select: { ad: { select: adCardSelect } },
  });
  const ads = favourites.map((f) => f.ad);

  return (
    <Container className="py-6 sm:py-10">
      <PageHeader title={t.favourites.title} subtitle={t.favourites.subtitle} />
      {ads.length ? (
        <AdGrid ads={ads} favouriteIds={ads.map((a) => a.id)} isLoggedIn />
      ) : (
        <EmptyState
          icon={<Heart className="size-6" />}
          title={t.favourites.emptyTitle}
          text={t.favourites.emptyText}
          action={
            <Link href="/search" className={buttonClass()}>
              {t.favourites.browse}
            </Link>
          }
        />
      )}
    </Container>
  );
}
