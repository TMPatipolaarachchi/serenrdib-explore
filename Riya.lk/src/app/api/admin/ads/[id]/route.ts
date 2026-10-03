import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, notFound, parseBody } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { adminAdActionSchema } from "@/lib/validations";
import { deleteImage } from "@/lib/upload";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/ads/:id
 *   { action: "approve" }                 → goes live
 *   { action: "reject", reason }          → hidden, seller sees the reason
 *   { action: "feature", value: boolean } → "Featured" on the homepage
 *   { action: "top", value: boolean }     → pinned to the top of search results
 */
export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  const body = await parseBody(req, adminAdActionSchema);

  const ad = await prisma.ad.findUnique({ where: { id }, select: { id: true, publishedAt: true } });
  if (!ad) throw notFound();

  const data =
    body.action === "approve"
      ? { status: "ACTIVE" as const, rejectionReason: null, publishedAt: ad.publishedAt ?? new Date() }
      : body.action === "reject"
        ? { status: "REJECTED" as const, rejectionReason: body.reason, isFeatured: false, isTopAd: false }
        : body.action === "feature"
          ? { isFeatured: body.value }
          : { isTopAd: body.value };

  const updated = await prisma.ad.update({
    where: { id },
    data,
    select: { id: true, status: true, isFeatured: true, isTopAd: true },
  });
  return NextResponse.json(updated);
});

/** DELETE /api/admin/ads/:id — permanently delete an ad and its photos. */
export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  const ad = await prisma.ad.findUnique({ where: { id }, include: { images: true } });
  if (!ad) throw notFound();

  await prisma.ad.delete({ where: { id } });
  await Promise.all(ad.images.map(deleteImage));
  return NextResponse.json({ ok: true });
});
