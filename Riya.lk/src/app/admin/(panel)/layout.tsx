import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/** Every page in the panel requires a signed-in admin who has changed the default password. */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [pendingAds, openReports] = await Promise.all([
    prisma.ad.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
  ]);

  return (
    <AdminShell username={admin.username} counts={{ pendingAds, openReports }}>
      {children}
    </AdminShell>
  );
}
