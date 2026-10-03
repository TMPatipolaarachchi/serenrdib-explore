import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CircleAlert, Heart, LayoutGrid, MessageCircle } from "lucide-react";
import { PasswordForm, ProfileForm } from "@/components/profile/profile-forms";
import { Avatar, Badge, Card, Container } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { fmt, formatDate } from "@/lib/i18n/config";
import { formatPhone } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.profile.title, robots: { index: false } };
}

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const { locale, t } = await getI18n();
  const verified = !!(user.phone && user.phoneVerifiedAt);

  return (
    <Container className="max-w-4xl py-6 sm:py-10">
      {/* Summary */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-brand-900 to-brand-700" />
        <div className="relative flex flex-col items-start gap-4 pt-8 sm:flex-row sm:items-end">
          <Avatar name={user.name} src={user.image} size={88} className="ring-4 ring-card" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{fmt(t.ad.memberSince, { date: formatDate(user.createdAt, locale) })}</p>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-3 gap-2">
          {[
            { href: "/my-ads", label: t.nav.myAds, icon: LayoutGrid },
            { href: "/favourites", label: t.nav.favourites, icon: Heart },
            { href: "/messages", label: t.nav.messages, icon: MessageCircle },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted/70 px-2 py-3 text-center text-xs font-semibold transition hover:bg-muted sm:text-sm"
            >
              <Icon className="size-5 text-brand-700 dark:text-brand-300" />
              {label}
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6">
        {/* Phone */}
        <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">{t.profile.phone}</h2>
            <div className="mt-1.5 flex items-center gap-2">
              {user.phone ? <span className="font-mono">{formatPhone(user.phone)}</span> : <span className="text-muted-foreground">—</span>}
              {verified ? (
                <Badge tone="success">
                  <BadgeCheck className="size-3.5" /> {t.profile.phoneVerified}
                </Badge>
              ) : (
                <Badge tone="warning">
                  <CircleAlert className="size-3.5" /> {t.profile.phoneNotVerified}
                </Badge>
              )}
            </div>
          </div>
          <Link href="/verify-phone?next=/profile" className={buttonClass({ variant: verified ? "outline" : "primary" })}>
            {verified ? t.profile.changePhone : t.profile.verifyPhone}
          </Link>
        </Card>

        <Card className="p-6">
          <h2 className="mb-5 text-lg font-semibold">{t.profile.personalInfo}</h2>
          <ProfileForm initial={{ name: user.name, district: user.district, city: user.city }} />
        </Card>

        <Card className="p-6">
          <h2 className="mb-5 text-lg font-semibold">{user.passwordHash ? t.profile.changePassword : t.profile.setPassword}</h2>
          <PasswordForm hasPassword={!!user.passwordHash} />
        </Card>
      </div>
    </Container>
  );
}
