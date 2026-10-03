import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminReportActions } from "@/components/admin/report-actions";
import { ADMIN_PAGE_SIZE, AdminHeader, EmptyRow, FilterTabs, STATUS_TONE, TableCard, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/i18n/config";
import en from "@/lib/i18n/dictionaries/en";
import { firstParam, toInt } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TABS = ["OPEN", "RESOLVED", "DISMISSED"] as const;
type Tab = (typeof TABS)[number];

export default async function AdminReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawTab = firstParam(params.status) as Tab | undefined;
  const tab: Tab = rawTab && TABS.includes(rawTab) ? rawTab : "OPEN";
  const page = Math.max(1, toInt(params.page) ?? 1);

  const [reports, total, counts] = await Promise.all([
    prisma.report.findMany({
      where: { status: tab },
      orderBy: { createdAt: tab === "OPEN" ? "asc" : "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: {
        reporter: { select: { name: true, email: true } },
        ad: {
          select: {
            id: true,
            title: true,
            status: true,
            user: { select: { name: true } },
            images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
            _count: { select: { reports: true } },
          },
        },
      },
    }),
    prisma.report.count({ where: { status: tab } }),
    Promise.all(TABS.map((t) => prisma.report.count({ where: { status: t } }))),
  ]);

  return (
    <>
      <AdminHeader title="Reported ads" subtitle="Review reports from users and take action" />
      <div className="mb-5">
        <FilterTabs
          active={tab}
          tabs={TABS.map((t, i) => ({ key: t, label: t.charAt(0) + t.slice(1).toLowerCase(), href: `/admin/reports?status=${t}`, count: counts[i] }))}
        />
      </div>

      <TableCard>
        <thead>
          <tr>
            <Th>Ad</Th>
            <Th>Reason</Th>
            <Th>Reported by</Th>
            <Th>When</Th>
            <Th className="text-right">{tab === "OPEN" ? "Actions" : "Note"}</Th>
          </tr>
        </thead>
        <tbody>
          {reports.length === 0 && <EmptyRow colSpan={5} text={tab === "OPEN" ? "No open reports. 🎉" : "Nothing here yet."} />}
          {reports.map((r) => (
            <tr key={r.id}>
              <Td>
                <Link href={`/admin/ads/${r.ad.id}`} className="flex items-center gap-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {r.ad.images[0] && <Image src={r.ad.images[0].url} alt="" fill sizes="48px" className="object-cover" />}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-1 max-w-64 font-medium hover:text-brand-700 dark:hover:text-brand-300">{r.ad.title}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      by {r.ad.user.name}
                      <Badge tone={STATUS_TONE[r.ad.status]}>{r.ad.status.toLowerCase()}</Badge>
                      {r.ad._count.reports > 1 && <Badge tone="danger">{r.ad._count.reports} reports</Badge>}
                    </span>
                  </span>
                </Link>
              </Td>
              <Td>
                <p className="font-medium">{en.enums.reportReason[r.reason]}</p>
                {r.details && <p className="mt-0.5 max-w-72 text-xs text-muted-foreground">{r.details}</p>}
              </Td>
              <Td>
                <p>{r.reporter?.name ?? "Deleted user"}</p>
                {r.reporter && <p className="text-xs text-muted-foreground">{r.reporter.email}</p>}
              </Td>
              <Td className="text-xs whitespace-nowrap text-muted-foreground">{timeAgo(r.createdAt, "en")}</Td>
              <Td>
                {tab === "OPEN" ? (
                  <AdminReportActions reportId={r.id} />
                ) : (
                  <p className="text-right text-xs text-muted-foreground">{r.adminNote ?? "—"}</p>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <Pagination
        page={page}
        pageCount={Math.ceil(total / ADMIN_PAGE_SIZE)}
        hrefFor={(p) => `/admin/reports?status=${tab}&page=${p}`}
        labels={{ previous: "Previous", next: "Next" }}
      />
    </>
  );
}
