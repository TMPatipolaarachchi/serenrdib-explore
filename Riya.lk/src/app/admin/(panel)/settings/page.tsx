import type { Metadata } from "next";
import { BannerManager, SettingsForm } from "@/components/admin/settings-forms";
import { AdminHeader } from "@/components/admin/ui";
import { Card } from "@/components/ui/misc";
import { getSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Site settings" };

export default async function AdminSettingsPage() {
  const [settings, banners] = await Promise.all([
    getSiteSettings(),
    prisma.banner.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <AdminHeader title="Site settings" subtitle="Logo, banners, contact details and moderation" />
      <div className="grid gap-6 2xl:grid-cols-2">
        <Card className="p-6">
          <SettingsForm
            initial={{
              siteName: settings.siteName,
              tagline: settings.tagline ?? "",
              logoUrl: settings.logoUrl ?? "",
              contactEmail: settings.contactEmail ?? "",
              contactPhone: settings.contactPhone ?? "",
              whatsappNumber: settings.whatsappNumber ?? "",
              address: settings.address ?? "",
              facebookUrl: settings.facebookUrl ?? "",
              instagramUrl: settings.instagramUrl ?? "",
              youtubeUrl: settings.youtubeUrl ?? "",
              tiktokUrl: settings.tiktokUrl ?? "",
              autoApproveAds: settings.autoApproveAds,
            }}
          />
        </Card>
        <Card className="h-fit p-6">
          <h2 className="mb-1 font-semibold">Homepage banners</h2>
          <p className="mb-4 text-sm text-muted-foreground">Rotating promotional banners shown below the categories.</p>
          <BannerManager
            banners={banners.map((b) => ({
              id: b.id,
              title: b.title,
              subtitle: b.subtitle,
              imageUrl: b.imageUrl,
              publicId: b.publicId,
              linkUrl: b.linkUrl,
              isActive: b.isActive,
              sortOrder: b.sortOrder,
            }))}
          />
        </Card>
      </div>
    </>
  );
}
