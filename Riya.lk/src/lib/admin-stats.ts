/**
 * Dashboard statistics. Days are bucketed in Sri Lanka time (UTC+05:30) so
 * "today" matches what admins see on the wall clock.
 */
import "server-only";
import { prisma } from "./prisma";
import { getCategoryAdCounts } from "./ads";
import { getCategoryTree } from "./categories";

const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** "2026-09-30" for a moment in time, in Colombo. */
export function colomboDayKey(date: Date): string {
  return new Date(date.getTime() + COLOMBO_OFFSET_MS).toISOString().slice(0, 10);
}

/** Midnight (Colombo) at the start of the day `daysAgo` days back, as a UTC instant. */
export function colomboStartOfDay(daysAgo = 0, now = new Date()): Date {
  const local = new Date(now.getTime() + COLOMBO_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - COLOMBO_OFFSET_MS - daysAgo * 86_400_000);
}

type DailyRow = { day: string; count: number };

/** Fills gaps so every day in the range has a value (0 when nothing happened). */
function fillDays(rows: DailyRow[], days: number, now: Date) {
  const byDay = new Map(rows.map((r) => [r.day, Number(r.count)]));
  return Array.from({ length: days }, (_, i) => {
    const key = colomboDayKey(new Date(now.getTime() - (days - 1 - i) * 86_400_000));
    return { day: key, count: byDay.get(key) ?? 0 };
  });
}

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

export async function getDashboardStats(range: Range) {
  const now = new Date();
  const from = colomboStartOfDay(range - 1, now);
  const today = colomboStartOfDay(0, now);
  // Raw SQL: compare against the stored UTC timestamps, then group by Colombo day.
  const fromUtc = from.toISOString();

  const [
    totalUsers,
    newUsers,
    totalAds,
    newAds,
    adsToday,
    statusGroups,
    openReports,
    adRows,
    userRows,
    categoryCounts,
    categories,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: from } } }),
    prisma.ad.count(),
    prisma.ad.count({ where: { createdAt: { gte: from } } }),
    prisma.ad.count({ where: { createdAt: { gte: today } } }),
    prisma.ad.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.$queryRaw<DailyRow[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Colombo', 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM "Ad"
      WHERE "createdAt" >= (${fromUtc}::timestamptz AT TIME ZONE 'UTC')
      GROUP BY 1`,
    prisma.$queryRaw<DailyRow[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Colombo', 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= (${fromUtc}::timestamptz AT TIME ZONE 'UTC')
      GROUP BY 1`,
    getCategoryAdCounts(),
    getCategoryTree(),
  ]);

  const status = (s: string) => statusGroups.find((g) => g.status === s)?._count._all ?? 0;

  return {
    range,
    totals: {
      users: totalUsers,
      newUsers,
      ads: totalAds,
      newAds,
      adsToday,
      active: status("ACTIVE"),
      pending: status("PENDING"),
      sold: status("SOLD"),
      rejected: status("REJECTED"),
      openReports,
    },
    dailyAds: fillDays(adRows, range, now),
    dailyUsers: fillDays(userRows, range, now),
    byCategory: categories
      .map((c) => ({ name: c.nameEn, count: categoryCounts[c.slug] ?? 0 }))
      .sort((a, b) => b.count - a.count),
  };
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;
