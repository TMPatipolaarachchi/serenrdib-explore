import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminAuthCard } from "@/components/admin/admin-auth-card";
import { AdminLoginForm } from "@/components/admin/admin-auth-forms";
import { getAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  const admin = await getAdmin();
  if (admin) redirect(admin.mustChangePassword ? "/admin/change-password" : "/admin");

  return (
    <AdminAuthCard title="Riya.lk Admin" subtitle="Authorised staff only">
      <AdminLoginForm />
    </AdminAuthCard>
  );
}
