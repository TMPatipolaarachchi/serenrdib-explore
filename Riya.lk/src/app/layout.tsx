import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { ThemeScript } from "@/components/theme/theme";
import { getI18n } from "@/lib/i18n/server";
import { LOCALE_TAGS } from "@/lib/i18n/config";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { jakarta, sinhala, tamil } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.title, template: `%s | ${SITE_NAME}` },
    description: t.meta.description,
    applicationName: SITE_NAME,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: t.meta.title,
      description: t.meta.description,
      locale: "en_LK",
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#070c19" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();

  return (
    // suppressHydrationWarning: <ThemeScript> sets the `dark` class before React hydrates.
    <html lang={LOCALE_TAGS[locale]} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${jakarta.variable} ${sinhala.variable} ${tamil.variable} min-h-dvh font-sans`}>
        <Providers locale={locale} dictionary={t}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
