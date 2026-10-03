import { notFound } from "next/navigation";
import { getCategoryScope } from "@/lib/categories";

/**
 * Checks the category exists *before* the page streams, so unknown slugs get a
 * real HTTP 404 (layouts render outside their segment's loading boundary).
 */
export default async function CategoryLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  if (!(await getCategoryScope((await params).slug))) notFound();
  return children;
}
