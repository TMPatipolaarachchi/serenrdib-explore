import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyPhoneForm } from "@/components/auth/verify-phone-form";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { firstParam, formatPhone, safeCallbackUrl } from "@/lib/utils";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.verify.title, robots: { index: false } };
}

export default async function VerifyPhonePage({ searchParams }: Props) {
  const next = safeCallbackUrl(firstParam((await searchParams).next), "/profile");
  const user = await requireUser(`/verify-phone?next=${encodeURIComponent(next)}`);
  const { t } = await getI18n();

  return (
    <AuthShell title={t.verify.title} subtitle={t.verify.subtitle}>
      {user.phone && user.phoneVerifiedAt && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
          <BadgeCheck className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">{fmt(t.verify.alreadyVerified, { phone: formatPhone(user.phone) })}</p>
            <p className="mt-0.5 opacity-80">{t.verify.verifyDifferent}</p>
          </div>
        </div>
      )}
      <VerifyPhoneForm initialPhone={user.phoneVerifiedAt ? null : user.phone} next={next} />
    </AuthShell>
  );
}
