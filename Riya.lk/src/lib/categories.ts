/**
 * Category helpers. Categories form a two-level tree (e.g. Vehicle Parts →
 * Engine Parts). Results are cached for the duration of a request.
 */
import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";
import type { CategoryType } from "./constants";

export interface CategoryNode {
  id: string;
  slug: string;
  nameEn: string;
  nameSi: string;
  nameTa: string;
  type: CategoryType;
  icon: string;
  parentId: string | null;
}

export interface CategoryTreeNode extends CategoryNode {
  children: CategoryNode[];
}

/** All active categories, ordered for display. */
export const getCategories = cache(async (): Promise<CategoryNode[]> => {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    select: { id: true, slug: true, nameEn: true, nameSi: true, nameTa: true, type: true, icon: true, parentId: true },
  });
});

/** Top-level categories with their children. */
export const getCategoryTree = cache(async (): Promise<CategoryTreeNode[]> => {
  const all = await getCategories();
  return all
    .filter((c) => !c.parentId)
    .map((c) => ({ ...c, children: all.filter((child) => child.parentId === c.id) }));
});

/** A category and the ids of it plus all its children (for filtering ads). */
export async function getCategoryScope(slug: string) {
  const all = await getCategories();
  const category = all.find((c) => c.slug === slug);
  if (!category) return null;
  const ids = [category.id, ...all.filter((c) => c.parentId === category.id).map((c) => c.id)];
  const parent = category.parentId ? all.find((c) => c.id === category.parentId) ?? null : null;
  return { category, parent, ids };
}
