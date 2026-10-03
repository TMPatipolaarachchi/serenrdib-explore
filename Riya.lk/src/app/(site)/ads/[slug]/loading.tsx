import { Card, Container, Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <Container className="py-5 sm:py-8">
      <Skeleton className="mb-4 h-4 w-48" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="space-y-3">
          <Skeleton className="aspect-[4/3] rounded-3xl" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-20 rounded-xl sm:w-24" />
            ))}
          </div>
        </div>
        <Card className="h-fit space-y-4 p-6">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-9 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-2.5">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </Card>
      </div>
    </Container>
  );
}
