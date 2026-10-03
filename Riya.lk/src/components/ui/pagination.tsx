import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page numbers to show: always first/last, current ±1, with gaps as null. */
function pageList(page: number, total: number): (number | null)[] {
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push(null);
    out.push(p);
  });
  return out;
}

/** Link-based pagination (works without JavaScript and is crawlable). */
export function Pagination({
  page,
  pageCount,
  hrefFor,
  labels,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  labels: { previous: string; next: string };
}) {
  if (pageCount <= 1) return null;
  const item = "flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-medium transition";

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(item, "border border-border bg-card hover:bg-muted")} rel="prev">
          <ChevronLeft className="size-4" />
          <span className="sr-only sm:not-sr-only sm:ml-1">{labels.previous}</span>
        </Link>
      ) : null}
      {pageList(page, pageCount).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              item,
              p === page ? "bg-brand-900 text-white dark:bg-brand-600" : "border border-border bg-card hover:bg-muted",
            )}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={cn(item, "border border-border bg-card hover:bg-muted")} rel="next">
          <span className="sr-only sm:not-sr-only sm:mr-1">{labels.next}</span>
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
