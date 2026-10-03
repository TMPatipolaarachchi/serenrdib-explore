import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { AdminAdActions } from "@/components/admin/ad-actions";
import { ADMIN_PAGE_SIZE, AdminHeader, EmptyRow, FilterTabs, STATUS_TONE, SearchBox, TableCard, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/i18n/config";
import { firstParam, formatPrice, toInt } from "@/lib/utils";

export const metadata: Metadata = { title: "Ads" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TABS = ["PENDING", "ACTIVE", "REJECTED", "SOLD", "FEATURED", "TOP", "all"] as const;
type Tab = (typeof TABS)[number];
const LABELS: Record<Tab, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  REJECTED: "Rejected",
  SOLD: "Sold",
  FEATURED: "Featured",
  TOP: "Top ads",
  all: "All",
};

function whereFor(tab: Tab): Prisma.AdWhereInput {
  if (tab === "all") return {};
  if (tab === "FEATURED") return { isFeatured: true };
  if (tab === "TOP") return { isTopAd: true };
  return { status: tab };
}

export default async function AdminAdsPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawTab = firstParam(params.status) as Tab | undefined;
  const tab: Tab = rawTab && TABS.includes(rawTab) ? rawTab : "PENDING";
  const q = firstParam(params.q)?.trim();
  const page = Math.max(1, toInt(params.page) ?? 1);

  const search: Prisma.AdWhereInput = q
    ? {
        OR: [
          { id: q },
          { slug: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { user: { name: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};
  const where: Prisma.AdWhereInput = { AND: [whereFor(tab), search] };

  const [ads, total, counts] = await Promise.all([
    prisma.ad.findMany({
      where,
      // The review queue is first-in, first-out; everything else newest first.
      orderBy: { createdAt: tab === "PENDING" ? "asc" : "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: {
        user: { select: { name: true, email: true } },
        category: { select: { nameEn: true } },
        images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
        _count: { select: { reports: { where: { status: "OPEN" } } } },
      },
    }),
    prisma.ad.count({ where }),
    Promise.all(TABS.map((t) => prisma.ad.count({ where: whereFor(t) }))),
  ]);

  const href = (patch: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { status: tab, q, page: undefined as number | undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && !(k === "page" && String(v) === "1")) sp.set(k, String(v));
    return `/admin/ads?${sp}`;
  };

  return (
    <>
      <AdminHeader title="Ads" subtitle="Approve new ads, handle rejections and promote listings" />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs active={tab} tabs={TABS.map((t, i) => ({ key: t, label: LABELS[t], href: href({ status: t, page: 1 }), count: counts[i] }))} />
        <SearchBox placeholder="Search title, ID or seller email…" defaultValue={q} hidden={{ status: tab }} />
      </div>

      <TableCard>
        <thead>
          <tr>
            <Th>Ad</Th>
            <Th>Seller</Th>
            <Th>Price</Th>
            <Th>Status</Th>
            <Th>Posted</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {ads.length === 0 && <EmptyRow colSpan={6} text={tab === "PENDING" ? "No ads waiting for review. 🎉" : "No ads found."} />}
          {ads.map((ad) => (
            <tr key={ad.id}>
              <Td>
                <Link href={`/admin/ads/${ad.id}`} className="flex items-center gap-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {ad.images[0] && <Image src={ad.images[0].url} alt="" fill sizes="56px" className="object-cover" />}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-1 max-w-72 font-medium hover:text-brand-700 dark:hover:text-brand-300">{ad.title}</span>
                    <span className="text-xs text-muted-foreground">{ad.category.nameEn}</span>
                    {ad._count.reports > 0 && (
                      <Badge tone="danger" className="ml-2">
                        {ad._count.reports} report{ad._count.reports > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </span>
                </Link>
              </Td>
              <Td>
                <p className="font-medium">{ad.user.name}</p>
                <p className="text-xs text-muted-foreground">{ad.user.email}</p>
              </Td>
              <Td className="font-semibold whitespace-nowrap">{ad.price != null ? formatPrice(ad.price) : "—"}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  <Badge tone={STATUS_TONE[ad.status]}>{ad.status.toLowerCase()}</Badge>
                  {ad.isFeatured && <Badge tone="brand">featured</Badge>}
                  {ad.isTopAd && <Badge tone="accent">top</Badge>}
                </div>
              </Td>
              <Td className="text-xs whitespace-nowrap text-muted-foreground">{timeAgo(ad.createdAt, "en")}</Td>
              <Td>
                <div className="flex justify-end">
                  <AdminAdActions compact ad={ad} />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <Pagination
        page={page}
        pageCount={Math.ceil(total / ADMIN_PAGE_SIZE)}
        hrefFor={(p) => href({ page: p })}
        labels={{ previous: "Previous", next: "Next" }}
      />
    </>
  );
}
