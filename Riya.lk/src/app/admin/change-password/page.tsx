import type { Metadata } from "next";
import Link from "next/link";
import { AdminAuthCard } from "@/components/admin/admin-auth-card";
import { AdminChangePasswordForm } from "@/components/admin/admin-auth-forms";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Change password" };

/** Forced on first login (seeded account); also reachable from the sidebar. */
export default async function AdminChangePasswordPage() {
  const admin = await requireAdmin({ allowPendingPasswordChange: true });

  return (
    <AdminAuthCard title="Change password" subtitle={`Signed in as ${admin.username}`}>
      <AdminChangePasswordForm forced={admin.mustChangePassword} />
      {!admin.mustChangePassword && (
        <Link href="/admin" className="mt-5 block text-center text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to dashboard
        </Link>
      )}
    </AdminAuthCard>
  );
}
