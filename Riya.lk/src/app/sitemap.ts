import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/constants";

// Rendered on request so builds never need database access.
export const dynamic = "force-dynamic";

/** XML sitemap: static pages, every category and the latest 5,000 live ads. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, ads] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.ad.findMany({
      where: { status: "ACTIVE" },
      orderBy: { publishedAt: "desc" },
      take: 5000,
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/safety`, changeFrequency: "yearly", priority: 0.3 },
    ...categories.map((c) => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...ads.map((a) => ({
      url: `${SITE_URL}/ads/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
