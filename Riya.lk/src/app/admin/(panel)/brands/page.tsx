import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { AddBrandButton } from "@/components/admin/brand-manager";
import { AdminHeader, EmptyRow, SearchBox, TableCard, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { prisma } from "@/lib/prisma";
import { firstParam, toInt } from "@/lib/utils";

export const metadata: Metadata = { title: "Brands & models" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const PAGE_SIZE = 30;

export default async function AdminBrandsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = firstParam(params.q)?.trim();
  const category = firstParam(params.category);
  const page = Math.max(1, toInt(params.page) ?? 1);

  const where: Prisma.BrandWhereInput = {
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(category ? { categories: { some: { id: category } } } : {}),
  };

  const [brands, total, vehicleCategories] = await Promise.all([
    prisma.brand.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        categories: { select: { id: true, nameEn: true }, orderBy: { sortOrder: "asc" } },
        _count: { select: { models: true, ads: true } },
      },
    }),
    prisma.brand.count({ where }),
    prisma.category.findMany({ where: { type: "VEHICLE", parentId: null }, orderBy: { sortOrder: "asc" }, select: { id: true, nameEn: true } }),
  ]);

  const qs = (patch: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, category, ...patch })) if (v !== undefined && v !== "" && !(k === "page" && String(v) === "1")) sp.set(k, String(v));
    return `/admin/brands?${sp}`;
  };

  return (
    <>
      <AdminHeader title="Brands & models" subtitle="Brands shown in each vehicle category, and their models" action={<AddBrandButton categories={vehicleCategories} />} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBox placeholder="Search brands…" defaultValue={q} hidden={{ category }} />
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Link href={qs({ category: undefined, page: 1 })} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${!category ? "bg-brand-900 text-white dark:bg-brand-600" : "border border-border bg-card"}`}>
            All
          </Link>
          {vehicleCategories.map((c) => (
            <Link
              key={c.id}
              href={qs({ category: c.id, page: 1 })}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${category === c.id ? "bg-brand-900 text-white dark:bg-brand-600" : "border border-border bg-card"}`}
            >
              {c.nameEn}
            </Link>
          ))}
        </div>
      </div>

      <TableCard>
        <thead>
          <tr>
            <Th>Brand</Th>
            <Th>Categories</Th>
            <Th>Models</Th>
            <Th>Ads</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {brands.length === 0 && <EmptyRow colSpan={6} text="No brands found." />}
          {brands.map((b) => (
            <tr key={b.id}>
              <Td>
                <Link href={`/admin/brands/${b.id}`} className="font-semibold hover:text-brand-700 dark:hover:text-brand-300">
                  {b.name}
                </Link>
                <p className="text-xs text-muted-foreground">/{b.slug}</p>
              </Td>
              <Td>
                <div className="flex max-w-md flex-wrap gap-1">
                  {b.categories.map((c) => (
                    <Badge key={c.id}>{c.nameEn}</Badge>
                  ))}
                </div>
              </Td>
              <Td>{b._count.models}</Td>
              <Td>{b._count.ads}</Td>
              <Td>{b.isActive ? <Badge tone="success">active</Badge> : <Badge tone="warning">hidden</Badge>}</Td>
              <Td className="text-right">
                <Link href={`/admin/brands/${b.id}`} className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
                  Manage →
                </Link>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} hrefFor={(p) => qs({ page: p })} labels={{ previous: "Previous", next: "Next" }} />
    </>
  );
}
