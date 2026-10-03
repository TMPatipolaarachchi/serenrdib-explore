import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handler, notFound, parseBody } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { vehicleModelSchema } from "@/lib/validations";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { slugify } from "@/lib/slug";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/models/:id */
export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  const data = await parseBody(req, vehicleModelSchema);
  try {
    const model = await prisma.vehicleModel.update({ where: { id }, data: { ...data, slug: slugify(data.name) } });
    return NextResponse.json(model);
  } catch (err) {
    if (isUniqueViolation(err)) throw new ApiError(409, "modelExists", { name: "modelExists" });
    throw err;
  }
});

/** DELETE /api/admin/models/:id — blocked while ads use the model. */
export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  const model = await prisma.vehicleModel.findUnique({ where: { id }, select: { _count: { select: { ads: true } } } });
  if (!model) throw notFound();
  if (model._count.ads > 0) throw new ApiError(409, "modelInUse");
  await prisma.vehicleModel.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
