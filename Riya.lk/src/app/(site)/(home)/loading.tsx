import { AdGridSkeleton } from "@/components/ads/ad-grid";
import { Container, Skeleton } from "@/components/ui/misc";

/** Homepage skeleton: hero + category tiles + ad grid. */
export default function Loading() {
  return (
    <>
      <div className="bg-brand-950 px-4 pt-14 pb-20 sm:pt-20 sm:pb-24">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="mx-auto h-6 w-48 rounded-full bg-white/10" />
          <div className="mx-auto h-12 w-4/5 rounded-xl bg-white/10" />
          <div className="mx-auto h-5 w-2/3 rounded bg-white/10" />
          <div className="mx-auto mt-8 h-16 max-w-4xl rounded-2xl bg-white/15" />
        </div>
      </div>
      <Container className="space-y-12 py-10">
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <AdGridSkeleton count={8} />
      </Container>
    </>
  );
}
