import type { Metadata } from "next";
import { ShieldCheck, ShoppingCart, Store } from "lucide-react";
import { Card, Container, PageHeader } from "@/components/ui/misc";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.safety.title, description: t.safety.subtitle };
}

export default async function SafetyPage() {
  const { t } = await getI18n();
  const sections = [
    { title: t.safety.buyersTitle, items: t.safety.buyers, icon: ShoppingCart },
    { title: t.safety.sellersTitle, items: t.safety.sellers, icon: Store },
  ];

  return (
    <Container className="max-w-4xl py-8 sm:py-12">
      <PageHeader title={t.safety.title} subtitle={t.safety.subtitle} />
      <div className="grid gap-6 md:grid-cols-2">
        {sections.map(({ title, items, icon: Icon }) => (
          <Card key={title} className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <Icon className="size-5" />
              </span>
              {title}
            </h2>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <p className="mt-6 rounded-2xl bg-accent-50 p-5 text-sm font-medium text-accent-800 dark:bg-accent-950/30 dark:text-accent-200">
        {t.safety.reportText}
      </p>
    </Container>
  );
}
