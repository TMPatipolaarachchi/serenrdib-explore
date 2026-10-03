import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser, googleEnabled } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { firstParam, safeCallbackUrl } from "@/lib/utils";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.signUp };
}

export default async function RegisterPage({ searchParams }: Props) {
  const callbackUrl = safeCallbackUrl(firstParam((await searchParams).callbackUrl));
  if (await getCurrentUser()) redirect(callbackUrl);

  const { t } = await getI18n();
  return (
    <AuthShell title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
      <RegisterForm callbackUrl={callbackUrl} googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
