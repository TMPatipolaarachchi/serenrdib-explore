import { BadgeCheck, MessagesSquare, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { getI18n } from "@/lib/i18n/server";

/** Two-column layout for login/register/verify pages (brand panel hidden on phones). */
export async function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { t } = await getI18n();
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:py-14 lg:grid-cols-2 lg:gap-0">
      <div className="relative hidden overflow-hidden rounded-l-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute -right-24 -bottom-24 size-80 rounded-full bg-accent-500/25 blur-3xl" />
        <LogoMark className="size-12" />
        <div className="relative space-y-6">
          <h2 className="text-3xl leading-tight font-extrabold">{t.home.heroTitle} {t.home.heroHighlight}</h2>
          <ul className="space-y-4 text-brand-100">
            {[
              { icon: BadgeCheck, text: t.home.why1Text },
              { icon: ShieldCheck, text: t.home.why2Text },
              { icon: MessagesSquare, text: t.home.why3Text },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-accent-400" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-brand-200/70">Riya.lk</p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-brand-950/5 sm:p-10 lg:rounded-l-none">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}
