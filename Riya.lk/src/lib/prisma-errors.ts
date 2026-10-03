/** True for Prisma unique-constraint violations (P2002). */
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

/** True for Prisma foreign-key violations (P2003) — e.g. deleting a category still used by ads. */
export function isForeignKeyViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2003";
}
