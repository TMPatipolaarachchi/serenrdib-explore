import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PUBLIC_AD_STATUSES, getAdDetail } from "@/lib/ads";

/**
 * Runs before the ad page streams (layouts sit outside their segment's
 * loading boundary), so missing, deleted or hidden ads return a real HTTP 404
 * — important for SEO when sold ads are removed.
 */
export default async function AdLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const ad = await getAdDetail((await params).slug);
  if (!ad) notFound();
  if (!PUBLIC_AD_STATUSES.has(ad.status)) {
    const user = await getCurrentUser();
    if (user?.id !== ad.userId) notFound();
  }
  return children;
}
