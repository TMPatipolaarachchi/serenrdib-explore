import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";
import type { SiteSettings } from "@/generated/prisma/client";

const DEFAULTS: Omit<SiteSettings, "updatedAt"> = {
  id: 1,
  siteName: "Riya.lk",
  tagline: null,
  logoUrl: null,
  contactEmail: null,
  contactPhone: null,
  whatsappNumber: null,
  address: null,
  facebookUrl: null,
  instagramUrl: null,
  youtubeUrl: null,
  tiktokUrl: null,
  autoApproveAds: false,
};

/** Site-wide settings edited in /admin/settings (cached per request). */
export const getSiteSettings = cache(async () => {
  const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return row ?? { ...DEFAULTS, updatedAt: new Date() };
});
