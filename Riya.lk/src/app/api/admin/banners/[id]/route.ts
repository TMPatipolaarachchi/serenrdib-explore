import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handler, notFound, parseBody } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { bannerSchema } from "@/lib/validations";
import { deleteImage, isAllowedImageUrl } from "@/lib/upload";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/banners/:id */
export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  const data = await parseBody(req, bannerSchema);
  if (!isAllowedImageUrl(data.imageUrl)) throw new ApiError(400, "validationFailed", { imageUrl: "invalidImage" });

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw notFound();
  const banner = await prisma.banner.update({ where: { id }, data });
  if (existing.imageUrl !== data.imageUrl) await deleteImage({ url: existing.imageUrl, publicId: existing.publicId });
  return NextResponse.json(banner);
});

/** DELETE /api/admin/banners/:id */
export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) throw notFound();
  await prisma.banner.delete({ where: { id } });
  await deleteImage({ url: banner.imageUrl, publicId: banner.publicId });
  return NextResponse.json({ ok: true });
});
