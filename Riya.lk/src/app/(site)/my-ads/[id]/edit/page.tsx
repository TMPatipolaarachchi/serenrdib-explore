import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdForm } from "@/components/ads/ad-form";
import { Container, PageHeader } from "@/components/ui/misc";
import { requireUser } from "@/lib/auth";
import { getCategoryTree } from "@/lib/categories";
import { getI18n } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.postAd.editTitle, robots: { index: false } };
}

export default async function EditAdPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(`/my-ads/${id}/edit`);
  if (!user.phone || !user.phoneVerifiedAt) redirect(`/verify-phone?next=/my-ads/${id}/edit`);

  const [ad, { t }, categories] = await Promise.all([
    prisma.ad.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } }, category: { select: { type: true } } },
    }),
    getI18n(),
    getCategoryTree(),
  ]);
  if (!ad || ad.userId !== user.id) notFound();
  if (ad.status === "SOLD") redirect("/my-ads");

  const str = (v: number | null) => (v == null ? "" : String(v));

  return (
    <Container className="max-w-4xl py-6 sm:py-10">
      <PageHeader title={t.postAd.editTitle} subtitle={ad.title} />
      <AdForm
        mode="edit"
        adId={ad.id}
        categories={categories}
        user={{ name: user.name, phone: user.phone, district: user.district, city: user.city }}
        initial={{
          categoryId: ad.categoryId,
          categoryType: ad.category.type,
          title: ad.title,
          description: ad.description,
          price: str(ad.price),
          negotiable: ad.negotiable,
          condition: ad.condition ?? "",
          brandId: ad.brandId ?? "",
          modelId: ad.modelId ?? "",
          modelText: ad.modelText ?? "",
          year: str(ad.year),
          mileage: str(ad.mileage),
          fuelType: ad.fuelType ?? "",
          transmission: ad.transmission ?? "",
          engineCapacity: str(ad.engineCapacity),
          partNumber: ad.partNumber ?? "",
          compatibility: ad.compatibility ?? "",
          district: ad.district,
          city: ad.city,
          contactName: ad.contactName ?? user.name,
          images: ad.images.map((i) => ({ url: i.url, publicId: i.publicId, width: i.width, height: i.height })),
        }}
      />
    </Container>
  );
}
