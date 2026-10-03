import { AdGridSkeleton } from "@/components/ads/ad-grid";
import { Card, Container, Skeleton } from "@/components/ui/misc";

/** Loading state for search/category pages (filters sidebar + results). */
export function SearchSkeleton() {
  return (
    <Container className="py-6 sm:py-8">
      <Skeleton className="mb-3 h-4 w-40" />
      <Skeleton className="h-8 w-72 max-w-full" />
      <div className="mt-6 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
        <Card className="hidden space-y-5 p-5 lg:block">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 rounded-xl" />
            </div>
          ))}
        </Card>
        <div>
          <div className="mb-4 flex justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-44 rounded-xl" />
          </div>
          <AdGridSkeleton count={9} className="md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3" />
        </div>
      </div>
    </Container>
  );
}
