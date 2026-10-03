import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handler, notFound, parseBody } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { categorySchema } from "@/lib/validations";
import { isUniqueViolation } from "@/lib/prisma-errors";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/categories/:id */
export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  const data = await parseBody(req, categorySchema);

  if (data.parentId) {
    if (data.parentId === id) throw new ApiError(400, "validationFailed", { parentId: "invalidOption" });
    const [parent, childCount] = await Promise.all([
      prisma.category.findUnique({ where: { id: data.parentId }, select: { parentId: true } }),
      prisma.category.count({ where: { parentId: id } }),
    ]);
    // Keep the tree two levels deep.
    if (!parent || parent.parentId || childCount > 0) throw new ApiError(400, "validationFailed", { parentId: "invalidOption" });
  }

  try {
    const category = await prisma.category.update({ where: { id }, data });
    return NextResponse.json(category);
  } catch (err) {
    if (isUniqueViolation(err)) throw new ApiError(409, "slugTaken", { slug: "slugTaken" });
    throw err;
  }
});

/** DELETE /api/admin/categories/:id — only when it has no ads and no subcategories. */
export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  const category = await prisma.category.findUnique({
    where: { id },
    select: { _count: { select: { ads: true, children: true } } },
  });
  if (!category) throw notFound();
  if (category._count.ads > 0 || category._count.children > 0) throw new ApiError(409, "categoryInUse");

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
