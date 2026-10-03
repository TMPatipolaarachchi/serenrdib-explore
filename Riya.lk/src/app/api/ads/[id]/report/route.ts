import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { ApiError, handler, notFound, parseBody } from "@/lib/api";
import { reportSchema } from "@/lib/validations";

/** POST /api/ads/:id/report — report an ad to the moderators (once per user). */
export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await requireApiUser();
  const { reason, details } = await parseBody(req, reportSchema);

  const ad = await prisma.ad.findUnique({ where: { id }, select: { userId: true } });
  if (!ad) throw notFound();
  if (ad.userId === user.id) throw new ApiError(400, "forbidden");

  const existing = await prisma.report.findUnique({ where: { adId_reporterId: { adId: id, reporterId: user.id } } });
  if (existing) throw new ApiError(409, "alreadyReported");

  await prisma.report.create({ data: { adId: id, reporterId: user.id, reason, details } });
  return NextResponse.json({ ok: true }, { status: 201 });
});
