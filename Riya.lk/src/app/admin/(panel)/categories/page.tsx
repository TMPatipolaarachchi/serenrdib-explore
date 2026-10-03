import type { Metadata } from "next";
import { CategoryManager, type AdminCategory } from "@/components/admin/category-manager";
import { AdminHeader } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    include: { _count: { select: { ads: true } } },
  });

  const toItem = (c: (typeof rows)[number]) => ({
    id: c.id,
    slug: c.slug,
    nameEn: c.nameEn,
    nameSi: c.nameSi,
    nameTa: c.nameTa,
    type: c.type,
    icon: c.icon,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    parentId: c.parentId,
    adCount: c._count.ads,
  });
  const tree: AdminCategory[] = rows
    .filter((c) => !c.parentId)
    .map((c) => ({ ...toItem(c), children: rows.filter((ch) => ch.parentId === c.id).map(toItem) }));

  return (
    <>
      <AdminHeader title="Categories" subtitle="Top-level categories and their subcategories, in Sinhala, English and Tamil" />
      <CategoryManager categories={tree} />
    </>
  );
}
