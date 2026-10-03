import { AdCard, AdCardSkeleton, type AdCardItem } from "./ad-card";
import { cn } from "@/lib/utils";

const gridCols = "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4";

/** Responsive grid of ad cards (2 columns on phones → 4 on desktop). */
export function AdGrid({
  ads,
  favouriteIds = [],
  isLoggedIn = false,
  className,
  priorityCount = 0,
}: {
  ads: AdCardItem[];
  favouriteIds?: string[];
  isLoggedIn?: boolean;
  className?: string;
  /** How many cards at the top should load their images eagerly (LCP). */
  priorityCount?: number;
}) {
  const saved = new Set(favouriteIds);
  return (
    <div className={cn(gridCols, className)}>
      {ads.map((ad, i) => (
        <AdCard key={ad.id} ad={ad} saved={saved.has(ad.id)} isLoggedIn={isLoggedIn} priority={i < priorityCount} index={i} />
      ))}
    </div>
  );
}

export function AdGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn(gridCols, className)}>
      {Array.from({ length: count }, (_, i) => (
        <AdCardSkeleton key={i} />
      ))}
    </div>
  );
}
