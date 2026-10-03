import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { handler, tooManyRequests } from "@/lib/api";
import { parseAdFilters, searchAds } from "@/lib/ads";
import { assertCanPost, prepareAdInput } from "@/lib/ad-write";
import { getSiteSettings } from "@/lib/settings";
import { adSlug } from "@/lib/slug";

/** GET /api/ads?q=&category=&brand=… — public ad search (same filters as /search). */
export const GET = handler(async (req: NextRequest) => {
  const filters = parseAdFilters(Object.fromEntries(req.nextUrl.searchParams));
  const result = await searchAds(filters);
  return NextResponse.json(result);
});

/** POST /api/ads — create a new ad (requires a verified phone). */
export const POST = handler(async (req: Request) => {
  const user = await requireApiUser();
  assertCanPost(user);

  // Anti-spam: at most 20 new ads per user per 24 hours.
  const recent = await prisma.ad.count({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 86_400_000) } },
  });
  if (recent >= 20) throw tooManyRequests(3600);

  const { data, images } = await prepareAdInput(await req.json().catch(() => null), user);
  const { autoApproveAds } = await getSiteSettings();

  const ad = await prisma.ad.create({
    data: {
      ...data,
      slug: adSlug(data.title),
      contactName: data.contactName ?? user.name,
      userId: user.id,
      status: autoApproveAds ? "ACTIVE" : "PENDING",
      publishedAt: autoApproveAds ? new Date() : null,
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
    select: { id: true, slug: true, status: true },
  });

  return NextResponse.json(ad, { status: 201 });
});
