import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api";

/**
 * GET /api/catalog/brands?categoryId=… | ?category=<slug>
 *
 * Brands for a category. Vehicle categories return their linked brands;
 * parts & accessories return every brand (the "compatible vehicle" brand).
 * Subcategories fall back to their parent's brands.
 */
export const GET = handler(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;
  const categoryId = params.get("categoryId");
  const categorySlug = params.get("category");

  const category =
    categoryId || categorySlug
      ? await prisma.category.findFirst({
          where: categoryId ? { id: categoryId } : { slug: categorySlug! },
          select: { id: true, type: true, parentId: true },
        })
      : null;

  const select = { id: true, slug: true, name: true } as const;
  const orderBy = [{ sortOrder: "asc" as const }, { name: "asc" as const }];

  if (!category || category.type === "PART" || category.type === "ACCESSORY") {
    const brands = await prisma.brand.findMany({
      where: { isActive: true, categories: { some: { type: "VEHICLE" } } },
      select,
      orderBy,
    });
    return NextResponse.json(brands, { headers: { "Cache-Control": "public, max-age=300" } });
  }

  if (category.type === "SERVICE") return NextResponse.json([]);

  const ids = [category.id, ...(category.parentId ? [category.parentId] : [])];
  const brands = await prisma.brand.findMany({
    where: { isActive: true, categories: { some: { id: { in: ids } } } },
    select,
    orderBy,
  });
  return NextResponse.json(brands, { headers: { "Cache-Control": "public, max-age=300" } });
});
