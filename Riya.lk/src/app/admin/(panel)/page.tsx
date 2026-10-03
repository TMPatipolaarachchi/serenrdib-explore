import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";
import { AdminHeader } from "@/components/admin/ui";
import { CategoryBarChart, StatusBreakdown, TrendChart } from "@/components/admin/charts";
import { Card } from "@/components/ui/misc";
import { getDashboardStats, RANGES, type Range } from "@/lib/admin-stats";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/i18n/config";
import { cn, firstParam, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Stat tile: label · value · optional delta (sentence-case label, proportional figures). */
function StatTile({ label, value, delta, href }: { label: string; value: number; delta?: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-3xl font-semibold tracking-tight">{value.toLocaleString("en-LK")}</p>
      {delta && <p className="mt-1 text-xs font-medium text-[var(--delta-good)]">{delta}</p>}
    </>
  );
  return (
    <Card className={cn("viz p-5", href && "transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700")}>
      {href ? (
        <Link href={href} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
    </Card>
  );
}

export default async function AdminDashboardPage({ searchParams }: Props) {
  const raw = Number(firstParam((await searchParams).range));
  const range: Range = (RANGES as readonly number[]).includes(raw) ? (raw as Range) : 30;

  const [stats, pendingAds] = await Promise.all([
    getDashboardStats(range),
    prisma.ad.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        price: true,
        createdAt: true,
        user: { select: { name: true } },
        images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
  ]);
  const { totals } = stats;
  const sinceLabel = `in the last ${range} days`;

  return (
    <>
      <AdminHeader title="Dashboard" subtitle="Marketplace activity at a glance" />

      {/* One filter row above everything it scopes */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Period</span>
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`/admin?range=${r}`}
            aria-current={r === range ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
              r === range ? "bg-brand-900 text-white dark:bg-brand-600" : "border border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {r === range && <Check className="size-4" strokeWidth={3} />}
            Last {r} days
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Total users" value={totals.users} delta={totals.newUsers ? `+${totals.newUsers.toLocaleString("en-LK")} ${sinceLabel}` : undefined} href="/admin/users" />
        <StatTile label="Total ads" value={totals.ads} delta={totals.newAds ? `+${totals.newAds.toLocaleString("en-LK")} ${sinceLabel}` : undefined} href="/admin/ads?status=all" />
        <StatTile label="New ads today" value={totals.adsToday} />
        <StatTile label="Waiting for review" value={totals.pending} href="/admin/ads" />
        <StatTile label="Active ads" value={totals.active} href="/admin/ads?status=ACTIVE" />
        <StatTile label="Sold ads" value={totals.sold} href="/admin/ads?status=SOLD" />
        <StatTile label="Rejected ads" value={totals.rejected} href="/admin/ads?status=REJECTED" />
        <StatTile label="Open reports" value={totals.openReports} href="/admin/reports" />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold">New ads per day</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {totals.newAds.toLocaleString("en-LK")} ads posted {sinceLabel}
          </p>
          <TrendChart data={stats.dailyAds} seriesName="New ads" />
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold">New users per day</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {totals.newUsers.toLocaleString("en-LK")} sign-ups {sinceLabel}
          </p>
          <TrendChart data={stats.dailyUsers} seriesName="New users" />
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold">Ads by status</h2>
          <p className="mb-5 text-sm text-muted-foreground">Active vs sold, plus ads in moderation (all time)</p>
          <StatusBreakdown
            segments={[
              { label: "Active", count: totals.active },
              { label: "Pending", count: totals.pending },
              { label: "Sold", count: totals.sold },
              { label: "Rejected", count: totals.rejected },
            ]}
          />
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold">Active ads by category</h2>
          <p className="mb-4 text-sm text-muted-foreground">Live listings in each top-level category</p>
          <CategoryBarChart data={stats.byCategory} seriesName="Active ads" />
        </Card>
      </div>

      <Card className="mt-6 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Oldest ads waiting for review</h2>
          <Link href="/admin/ads" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-accent-600 dark:text-brand-300">
            Review queue <ArrowRight className="size-4" />
          </Link>
        </div>
        {pendingAds.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing to review — the queue is empty.</p>
        ) : (
          <ul className="divide-y divide-border">
            {pendingAds.map((ad) => (
              <li key={ad.id}>
                <Link href={`/admin/ads/${ad.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {ad.images[0] && <Image src={ad.images[0].url} alt="" fill sizes="48px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{ad.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {ad.user.name} · {ad.price != null ? formatPrice(ad.price) : "Price on request"}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5" /> {timeAgo(ad.createdAt, "en")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
