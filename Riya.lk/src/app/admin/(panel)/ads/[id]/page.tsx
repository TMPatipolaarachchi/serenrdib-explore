import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminAdActions } from "@/components/admin/ad-actions";
import { Badge, Card } from "@/components/ui/misc";
import { prisma } from "@/lib/prisma";
import { cityName, districtName } from "@/lib/data/locations";
import { formatDate, timeAgo } from "@/lib/i18n/config";
import { formatNumber, formatPhone, formatPrice } from "@/lib/utils";
import { STATUS_TONE } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Review ad" };

type Props = { params: Promise<{ id: string }> };

/** Full preview of any ad (including pending/rejected) for moderation. */
export default async function AdminAdDetailPage({ params }: Props) {
  const { id } = await params;
  const ad = await prisma.ad.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: { include: { parent: true } },
      brand: true,
      model: true,
      user: {
        select: { id: true, name: true, email: true, phone: true, phoneVerifiedAt: true, status: true, createdAt: true, _count: { select: { ads: true } } },
      },
      reports: { orderBy: { createdAt: "desc" }, include: { reporter: { select: { name: true, email: true } } } },
    },
  });
  if (!ad) notFound();

  const details: [string, string | null | undefined][] = [
    ["Category", [ad.category.parent?.nameEn, ad.category.nameEn].filter(Boolean).join(" › ")],
    ["Condition", ad.condition?.toLowerCase()],
    ["Brand / model", [ad.brand?.name, ad.model?.name ?? ad.modelText].filter(Boolean).join(" ") || null],
    ["Year", ad.year?.toString()],
    ["Mileage", ad.mileage != null ? `${formatNumber(ad.mileage)} km` : null],
    ["Fuel", ad.fuelType?.toLowerCase()],
    ["Transmission", ad.transmission?.toLowerCase()],
    ["Engine", ad.engineCapacity ? `${formatNumber(ad.engineCapacity)} cc` : null],
    ["Part number", ad.partNumber],
    ["Compatibility", ad.compatibility],
    ["Location", `${cityName(ad.district, ad.city)}, ${districtName(ad.district)}`],
    ["Contact", `${ad.contactName ?? ""} · ${formatPhone(ad.contactPhone)}`],
    ["Views", formatNumber(ad.views)],
    ["Created", `${formatDate(ad.createdAt, "en")} (${timeAgo(ad.createdAt, "en")})`],
  ];

  return (
    <>
      <Link href="/admin/ads" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to ads
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge tone={STATUS_TONE[ad.status]}>{ad.status.toLowerCase()}</Badge>
            {ad.isFeatured && <Badge tone="brand">featured</Badge>}
            {ad.isTopAd && <Badge tone="accent">top ad</Badge>}
          </div>
          <h1 className="text-2xl font-bold">{ad.title}</h1>
          <p className="mt-1 text-xl font-extrabold text-accent-600">
            {ad.price != null ? formatPrice(ad.price) : "Price on request"}
            {ad.negotiable && <span className="ml-2 text-sm font-medium text-emerald-600">negotiable</span>}
          </p>
          {ad.status === "REJECTED" && ad.rejectionReason && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">Rejected: {ad.rejectionReason}</p>
          )}
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <AdminAdActions ad={ad} afterDelete="/admin/ads" />
          {(ad.status === "ACTIVE" || ad.status === "SOLD") && (
            <Link href={`/ads/${ad.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
              View on site <ExternalLink className="size-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card className="p-4">
            {ad.images.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ad.images.map((img, i) => (
                  <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                    <Image src={img.url} alt={`Photo ${i + 1}`} fill sizes="(max-width: 640px) 50vw, 300px" className="object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No photos</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 font-semibold">Description</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line">{ad.description}</p>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 font-semibold">Reports ({ad.reports.length})</h2>
            {ad.reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reports for this ad.</p>
            ) : (
              <ul className="divide-y divide-border">
                {ad.reports.map((r) => (
                  <li key={r.id} className="py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={r.status === "OPEN" ? "danger" : "neutral"}>{r.status.toLowerCase()}</Badge>
                      <span className="font-medium">{r.reason.replace("_", " ").toLowerCase()}</span>
                      <span className="text-xs text-muted-foreground">
                        by {r.reporter?.name ?? "deleted user"} · {timeAgo(r.createdAt, "en")}
                      </span>
                    </div>
                    {r.details && <p className="mt-1 text-muted-foreground">{r.details}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 font-semibold">Details</h2>
            <dl className="space-y-2.5 text-sm">
              {details
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium capitalize">{v}</dd>
                  </div>
                ))}
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 font-semibold">Seller</h2>
            <p className="font-medium">{ad.user.name}</p>
            <p className="text-sm text-muted-foreground">{ad.user.email}</p>
            <p className="mt-1 text-sm">
              {ad.user.phone ? formatPhone(ad.user.phone) : "No phone"}{" "}
              {ad.user.phoneVerifiedAt && <Badge tone="success">verified</Badge>}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {ad.user._count.ads} ads · joined {formatDate(ad.user.createdAt, "en")} · {ad.user.status.toLowerCase()}
            </p>
            <Link href={`/admin/users?q=${encodeURIComponent(ad.user.email)}`} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
              Manage user →
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
