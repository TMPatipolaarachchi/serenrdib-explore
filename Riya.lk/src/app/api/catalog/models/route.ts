import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api";

/**
 * GET /api/catalog/models?brandId=… | ?brand=<slug>  [&categoryId=… | &category=<slug>]
 *
 * Models of a brand. When a *vehicle* category is given, only models of that
 * category (or with no category) are returned — so "Honda" under Cars shows
 * Fit/Civic, not Dio/CB Shine.
 */
export const GET = handler(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;
  const brandId = params.get("brandId");
  const brandSlug = params.get("brand");
  if (!brandId && !brandSlug) return NextResponse.json([]);

  const brand = await prisma.brand.findFirst({
    where: brandId ? { id: brandId } : { slug: brandSlug! },
    select: { id: true },
  });
  if (!brand) return NextResponse.json([]);

  const categoryId = params.get("categoryId");
  const categorySlug = params.get("category");
  const category =
    categoryId || categorySlug
      ? await prisma.category.findFirst({
          where: categoryId ? { id: categoryId } : { slug: categorySlug! },
          select: { id: true, type: true, parentId: true },
        })
      : null;

  const categoryFilter =
    category?.type === "VEHICLE"
      ? { OR: [{ categoryId: { in: [category.id, ...(category.parentId ? [category.parentId] : [])] } }, { categoryId: null }] }
      : {};

  const models = await prisma.vehicleModel.findMany({
    where: { brandId: brand.id, isActive: true, ...categoryFilter },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(models, { headers: { "Cache-Control": "public, max-age=300" } });
});
