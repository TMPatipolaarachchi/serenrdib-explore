import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { ApiError, handler, notFound } from "@/lib/api";

/** POST /api/ads/:id/sold — the owner marks an active ad as sold. */
export const POST = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await requireApiUser();

  const ad = await prisma.ad.findUnique({ where: { id }, select: { userId: true, status: true } });
  if (!ad) throw notFound();
  if (ad.userId !== user.id) throw new ApiError(403, "forbidden");
  if (ad.status !== "ACTIVE") throw new ApiError(409, "badRequest");

  await prisma.ad.update({ where: { id }, data: { status: "SOLD", soldAt: new Date(), isTopAd: false } });
  return NextResponse.json({ ok: true });
});
