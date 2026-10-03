import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { handler, notFound, parseBody } from "@/lib/api";

/** GET /api/favourites — ids of the ads the user has saved. */
export const GET = handler(async () => {
  const user = await requireApiUser();
  const favs = await prisma.favourite.findMany({ where: { userId: user.id }, select: { adId: true } });
  return NextResponse.json(favs.map((f) => f.adId));
});

/** POST /api/favourites { adId } — save an ad (idempotent). */
export const POST = handler(async (req: Request) => {
  const user = await requireApiUser();
  const { adId } = await parseBody(req, z.object({ adId: z.string().min(1) }));

  const ad = await prisma.ad.findUnique({ where: { id: adId }, select: { id: true } });
  if (!ad) throw notFound();

  await prisma.favourite.upsert({
    where: { userId_adId: { userId: user.id, adId } },
    update: {},
    create: { userId: user.id, adId },
  });
  return NextResponse.json({ ok: true, saved: true });
});
