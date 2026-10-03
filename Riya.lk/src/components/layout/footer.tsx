import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/logo";
import { Container } from "@/components/ui/misc";
import { getI18n } from "@/lib/i18n/server";
import { categoryName } from "@/lib/i18n/config";
import { getCategoryTree } from "@/lib/categories";
import { getSiteSettings } from "@/lib/settings";
import { FacebookIcon, InstagramIcon, TiktokIcon, YoutubeIcon } from "./social-icons";

export async function Footer() {
  const [{ locale, t }, categories, settings] = await Promise.all([getI18n(), getCategoryTree(), getSiteSettings()]);

  const socials = [
    { href: settings.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    { href: settings.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: settings.youtubeUrl, label: "YouTube", Icon: YoutubeIcon },
    { href: settings.tiktokUrl, label: "TikTok", Icon: TiktokIcon },
  ].filter((s) => s.href);

  return (
    <footer className="mt-20 border-t border-border bg-card">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo logoUrl={settings.logoUrl} />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{t.footer.aboutText}</p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground transition hover:bg-brand-900 hover:text-white"
                >
                  <Icon className="size-[18px]" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">{t.footer.categories}</h3>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="text-muted-foreground transition hover:text-accent-600">
                  {categoryName(c, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">{t.footer.explore}</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              { href: "/search", label: t.search.title },
              { href: "/post-ad", label: t.nav.postFreeAd },
              { href: "/my-ads", label: t.nav.myAds },
              { href: "/safety", label: t.footer.safetyTips },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted-foreground transition hover:text-accent-600">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">{t.footer.contact}</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {settings.contactPhone && (
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0" />
                <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`} className="hover:text-accent-600">
                  {settings.contactPhone}
                </a>
              </li>
            )}
            {settings.contactEmail && (
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0" />
                <a href={`mailto:${settings.contactEmail}`} className="break-all hover:text-accent-600">
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>{settings.address}</span>
              </li>
            )}
          </ul>
        </div>
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {settings.siteName}. {t.footer.rights}
          </p>
          <p>{t.footer.madeIn}</p>
        </Container>
      </div>
    </footer>
  );
}
