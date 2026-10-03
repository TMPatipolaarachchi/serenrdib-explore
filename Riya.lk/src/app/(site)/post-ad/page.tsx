import type { Metadata } from "next";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { AdForm } from "@/components/ads/ad-form";
import { Card, Container, PageHeader } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getCategoryTree } from "@/lib/categories";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.postAd.title, robots: { index: false } };
}

export default async function PostAdPage() {
  const user = await requireUser("/post-ad");
  const [{ t }, categories] = await Promise.all([getI18n(), getCategoryTree()]);

  // Sellers must verify their phone with an OTP before posting.
  if (!user.phone || !user.phoneVerifiedAt) {
    return (
      <Container className="max-w-xl py-10 sm:py-16">
        <Card className="p-8 text-center sm:p-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 dark:bg-accent-950/40 dark:text-accent-400">
            <Smartphone className="size-8" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">{t.postAd.verifyPhoneTitle}</h1>
          <p className="mt-2 text-muted-foreground">{t.postAd.verifyPhoneText}</p>
          <Link href="/verify-phone?next=/post-ad" className={buttonClass({ size: "lg", className: "mt-8" })}>
            {t.postAd.verifyNow}
          </Link>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="max-w-4xl py-6 sm:py-10">
      <PageHeader title={t.postAd.title} subtitle={t.postAd.subtitle} />
      <AdForm
        mode="create"
        categories={categories}
        user={{ name: user.name, phone: user.phone, district: user.district, city: user.city }}
      />
    </Container>
  );
}
