import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EditBrandForm, ModelManager } from "@/components/admin/brand-manager";
import { AdminHeader } from "@/components/admin/ui";
import { Card } from "@/components/ui/misc";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Brand" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminBrandPage({ params }: Props) {
  const { id } = await params;
  const [brand, vehicleCategories] = await Promise.all([
    prisma.brand.findUnique({
      where: { id },
      include: {
        categories: { select: { id: true } },
        models: { orderBy: { name: "asc" }, include: { _count: { select: { ads: true } } } },
        _count: { select: { ads: true } },
      },
    }),
    prisma.category.findMany({ where: { type: "VEHICLE", parentId: null }, orderBy: { sortOrder: "asc" }, select: { id: true, nameEn: true } }),
  ]);
  if (!brand) notFound();

  return (
    <>
      <Link href="/admin/brands" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All brands
      </Link>
      <AdminHeader title={brand.name} subtitle={`${brand.models.length} models · ${brand._count.ads} ads`} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="h-fit p-6">
          <h2 className="mb-4 font-semibold">Brand details</h2>
          <EditBrandForm
            brand={{ id: brand.id, name: brand.name, slug: brand.slug, isActive: brand.isActive, categoryIds: brand.categories.map((c) => c.id) }}
            categories={vehicleCategories}
            adCount={brand._count.ads}
          />
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Models</h2>
          <ModelManager
            brandId={brand.id}
            categories={vehicleCategories}
            models={brand.models.map((m) => ({ id: m.id, name: m.name, categoryId: m.categoryId, isActive: m.isActive, adCount: m._count.ads }))}
          />
        </Card>
      </div>
    </>
  );
}
