import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { ApiError, handler, notFound } from "@/lib/api";
import { assertCanPost, prepareAdInput } from "@/lib/ad-write";
import { getSiteSettings } from "@/lib/settings";
import { deleteImage } from "@/lib/upload";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnAd(id: string, userId: string) {
  const ad = await prisma.ad.findUnique({ where: { id }, include: { images: true } });
  if (!ad) throw notFound();
  if (ad.userId !== userId) throw new ApiError(403, "forbidden");
  return ad;
}

/**
 * PATCH /api/ads/:id — edit your own ad.
 * Edited ads go back to review unless auto-approval is enabled.
 */
export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireApiUser();
  assertCanPost(user);
  const ad = await getOwnAd(id, user.id);
  if (ad.status === "SOLD") throw new ApiError(409, "forbidden");

  const { data, images } = await prepareAdInput(await req.json().catch(() => null), user);
  const { autoApproveAds } = await getSiteSettings();
  const goesLive = autoApproveAds;

  await prisma.$transaction([
    prisma.adImage.deleteMany({ where: { adId: ad.id } }),
    prisma.ad.update({
      where: { id: ad.id },
      data: {
        ...data,
        contactName: data.contactName ?? user.name,
        status: goesLive ? "ACTIVE" : "PENDING",
        rejectionReason: null,
        publishedAt: goesLive ? (ad.publishedAt ?? new Date()) : ad.publishedAt,
        images: {
          create: images.map((img, i) => ({
            url: img.url,
            publicId: img.publicId ?? null,
            width: img.width ?? null,
            height: img.height ?? null,
            sortOrder: i,
          })),
        },
      },
    }),
  ]);

  // Remove files for photos the seller took out of the ad.
  const kept = new Set(images.map((i) => i.url));
  await Promise.all(ad.images.filter((img) => !kept.has(img.url)).map(deleteImage));

  return NextResponse.json({ id: ad.id, slug: ad.slug, status: goesLive ? "ACTIVE" : "PENDING" });
});

/** DELETE /api/ads/:id — delete your own ad and its photos. */
export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireApiUser();
  const ad = await getOwnAd(id, user.id);

  await prisma.ad.delete({ where: { id: ad.id } });
  await Promise.all(ad.images.map(deleteImage));

  return NextResponse.json({ ok: true });
});
