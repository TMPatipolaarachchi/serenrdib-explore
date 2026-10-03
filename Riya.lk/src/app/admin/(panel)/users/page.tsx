import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma/client";
import { AdminUserActions } from "@/components/admin/user-actions";
import { ADMIN_PAGE_SIZE, AdminHeader, EmptyRow, FilterTabs, SearchBox, TableCard, Td, Th } from "@/components/admin/ui";
import { Avatar, Badge } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/i18n/config";
import { firstParam, formatPhone, normalizeSriLankanPhone, toInt } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TABS = ["all", "ACTIVE", "SUSPENDED", "BANNED"] as const;
type Tab = (typeof TABS)[number];
const LABELS: Record<Tab, string> = { all: "All", ACTIVE: "Active", SUSPENDED: "Suspended", BANNED: "Banned" };

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawTab = firstParam(params.status) as Tab | undefined;
  const tab: Tab = rawTab && TABS.includes(rawTab) ? rawTab : "all";
  const q = firstParam(params.q)?.trim();
  const page = Math.max(1, toInt(params.page) ?? 1);

  const phone = q ? normalizeSriLankanPhone(q) : null;
  const where: Prisma.UserWhereInput = {
    ...(tab !== "all" ? { status: tab } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            ...(phone ? [{ phone }] : []),
            { id: q },
          ],
        }
      : {}),
  };

  const [users, total, counts] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        phoneVerifiedAt: true,
        status: true,
        suspendedUntil: true,
        statusReason: true,
        googleId: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { ads: true } },
      },
    }),
    prisma.user.count({ where }),
    Promise.all(TABS.map((t) => prisma.user.count({ where: t === "all" ? {} : { status: t } }))),
  ]);

  const href = (patch: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ status: tab, q, ...patch })) if (v !== undefined && v !== "" && v !== "all" && !(k === "page" && String(v) === "1")) sp.set(k, String(v));
    return `/admin/users?${sp}`;
  };

  return (
    <>
      <AdminHeader title="Users" subtitle="View, suspend, ban or delete accounts" />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs active={tab} tabs={TABS.map((t, i) => ({ key: t, label: LABELS[t], href: href({ status: t, page: 1 }), count: counts[i] }))} />
        <SearchBox placeholder="Search name, email or phone…" defaultValue={q} hidden={{ status: tab === "all" ? undefined : tab }} />
      </div>

      <TableCard>
        <thead>
          <tr>
            <Th>User</Th>
            <Th>Phone</Th>
            <Th>Ads</Th>
            <Th>Joined</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && <EmptyRow colSpan={6} text="No users found." />}
          {users.map((u) => (
            <tr key={u.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} src={u.image} size={36} />
                  <div className="min-w-0">
                    <p className="font-medium">
                      {u.name} {u.googleId && <span className="text-xs font-normal text-muted-foreground">(Google)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
              </Td>
              <Td className="whitespace-nowrap">
                {u.phone ? formatPhone(u.phone) : <span className="text-muted-foreground">—</span>}{" "}
                {u.phoneVerifiedAt && <Badge tone="success">verified</Badge>}
              </Td>
              <Td>{u._count.ads}</Td>
              <Td className="text-xs whitespace-nowrap text-muted-foreground">
                {formatDate(u.createdAt, "en")}
                {u.lastLoginAt && <span className="block">last seen {formatDate(u.lastLoginAt, "en")}</span>}
              </Td>
              <Td>
                <Badge tone={u.status === "ACTIVE" ? "success" : u.status === "SUSPENDED" ? "warning" : "danger"}>{u.status.toLowerCase()}</Badge>
                {u.status === "SUSPENDED" && u.suspendedUntil && (
                  <span className="mt-1 block text-xs text-muted-foreground">until {formatDate(u.suspendedUntil, "en")}</span>
                )}
                {u.statusReason && <span className="mt-1 block max-w-48 truncate text-xs text-muted-foreground" title={u.statusReason}>{u.statusReason}</span>}
              </Td>
              <Td>
                <AdminUserActions user={u} />
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <Pagination page={page} pageCount={Math.ceil(total / ADMIN_PAGE_SIZE)} hrefFor={(p) => href({ page: p })} labels={{ previous: "Previous", next: "Next" }} />
    </>
  );
}
