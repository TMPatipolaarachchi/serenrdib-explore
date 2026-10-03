import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma client singleton.
 *
 * In development Next.js hot-reloads modules, which would otherwise open a new
 * connection pool on every change — so we cache the client on `globalThis`.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // Optional pool size. The local `npx prisma dev` database only handles one
  // connection at a time, so set DATABASE_POOL_MAX=1 there (pg's default is 10).
  const max = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "", 10);
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    ...(max > 0 ? { max } : {}),
  });
  return new PrismaClient({
    adapter,
    // Prisma's defaults (2s to start a transaction, 5s to finish) are tight when
    // the pool is busy; allow more headroom before failing a write.
    transactionOptions: { maxWait: 10_000, timeout: 15_000 },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
