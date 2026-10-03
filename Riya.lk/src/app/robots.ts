import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

/**
 * robots.txt — private user pages are excluded. The admin area is deliberately
 * NOT listed here (listing it would advertise its location); admin pages send
 * `X-Robots-Tag: noindex` instead (see src/proxy.ts).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/my-ads", "/favourites", "/messages", "/profile", "/post-ad", "/verify-phone"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
