import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handler, notFound, parseBody } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { brandSchema } from "@/lib/validations";
import { isUniqueViolation } from "@/lib/prisma-errors";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/brands/:id */
export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  const { categoryIds, ...data } = await parseBody(req, brandSchema);
  try {
    const brand = await prisma.brand.update({
      where: { id },
      data: { ...data, categories: { set: categoryIds.map((cid) => ({ id: cid })) } },
    });
    return NextResponse.json(brand);
  } catch (err) {
    if (isUniqueViolation(err)) throw new ApiError(409, "slugTaken", { slug: "slugTaken" });
    throw err;
  }
});

/**
 * DELETE /api/admin/brands/:id — blocked while ads reference the brand
 * (deactivate it instead to hide it from new ads).
 */
export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  const brand = await prisma.brand.findUnique({ where: { id }, select: { _count: { select: { ads: true } } } });
  if (!brand) throw notFound();
  if (brand._count.ads > 0) throw new ApiError(409, "brandInUse");
  await prisma.brand.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
