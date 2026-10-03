import { AdGridSkeleton } from "@/components/ads/ad-grid";
import { Container, Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <Container className="py-6 sm:py-10">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 mb-6 h-4 w-64" />
      <AdGridSkeleton count={8} />
    </Container>
  );
}
