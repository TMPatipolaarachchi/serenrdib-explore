import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { handler } from "@/lib/api";

/** DELETE /api/favourites/:adId — remove a saved ad. */
export const DELETE = handler(async (_req: Request, ctx: { params: Promise<{ adId: string }> }) => {
  const { adId } = await ctx.params;
  const user = await requireApiUser();
  await prisma.favourite.deleteMany({ where: { userId: user.id, adId } });
  return NextResponse.json({ ok: true, saved: false });
});
