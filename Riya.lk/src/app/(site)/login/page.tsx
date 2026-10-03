import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser, googleEnabled } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { firstParam, safeCallbackUrl } from "@/lib/utils";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.signIn, robots: { index: false } };
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(firstParam(params.callbackUrl));
  if (await getCurrentUser()) redirect(callbackUrl);

  const { t } = await getI18n();
  return (
    <AuthShell title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      <LoginForm callbackUrl={callbackUrl} googleEnabled={googleEnabled} initialError={firstParam(params.error)} />
    </AuthShell>
  );
}
