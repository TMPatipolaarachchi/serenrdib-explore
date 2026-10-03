/**
 * Admin authentication helpers (server only).
 *
 * Layers of protection for /admin:
 *   1. src/proxy.ts checks the signed session cookie on every /admin and
 *      /api/admin request and redirects/blocks when it's missing or invalid.
 *   2. Every admin page and API route calls `requireAdmin*()` below, which
 *      re-validates the token AND the admin row in the database (so a password
 *      change immediately invalidates old sessions).
 *   3. Login attempts are rate-limited using the AdminLoginAttempt table.
 */
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { ApiError, tooManyRequests } from "./api";
import { ADMIN_COOKIE, ADMIN_SESSION_HOURS, signAdminToken, verifyAdminToken } from "./admin-jwt";
import type { Admin } from "@/generated/prisma/client";

// ----------------------------------------------------------------------------
// Session cookie
// ----------------------------------------------------------------------------

export async function startAdminSession(admin: Admin) {
  const token = await signAdminToken({
    sub: admin.id,
    username: admin.username,
    mcp: admin.mustChangePassword,
    pv: admin.passwordVersion,
  });
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_HOURS * 60 * 60,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

/** The current admin (validated against the DB), or null. Cached per request. */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const payload = await verifyAdminToken(token);
  if (!payload) return null;
  const admin = await prisma.admin.findUnique({ where: { id: payload.sub } });
  if (!admin || admin.passwordVersion !== payload.pv) return null;
  return admin;
});

/**
 * For admin pages. Redirects to the login page when not signed in and to the
 * change-password page while the password still has to be changed.
 */
export async function requireAdmin(options: { allowPendingPasswordChange?: boolean } = {}): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.mustChangePassword && !options.allowPendingPasswordChange) redirect("/admin/change-password");
  return admin;
}

/** For admin API routes. Throws 401/403 ApiErrors instead of redirecting. */
export async function requireAdminApi(options: { allowPendingPasswordChange?: boolean } = {}): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) throw new ApiError(401, "unauthorized");
  if (admin.mustChangePassword && !options.allowPendingPasswordChange) {
    throw new ApiError(403, "passwordChangeRequired");
  }
  return admin;
}

// ----------------------------------------------------------------------------
// Login rate limiting (database-backed so it works across server instances)
// ----------------------------------------------------------------------------

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_IP = 5;
const MAX_FAILURES_PER_USERNAME = 20;

/** Throws a 429 ApiError when this IP or username has too many recent failures. */
export async function assertAdminLoginAllowed(ip: string, username: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const [ipFailures, userFailures] = await Promise.all([
    prisma.adminLoginAttempt.findMany({
      where: { ip, success: false, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.adminLoginAttempt.count({
      where: { username, success: false, createdAt: { gte: since } },
    }),
  ]);

  if (ipFailures.length >= MAX_FAILURES_PER_IP || userFailures >= MAX_FAILURES_PER_USERNAME) {
    // Retry once the oldest failure in the window expires.
    const oldest = ipFailures[0]?.createdAt ?? new Date();
    const retryAfter = (oldest.getTime() + WINDOW_MS - Date.now()) / 1000;
    throw tooManyRequests(retryAfter > 0 ? retryAfter : WINDOW_MS / 1000, "tooManyLoginAttempts");
  }
}

export async function recordAdminLoginAttempt(ip: string, username: string, success: boolean) {
  await prisma.adminLoginAttempt.create({ data: { ip, username, success } });
  // Housekeeping: forget attempts older than a day.
  if (Math.random() < 0.05) {
    await prisma.adminLoginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } } });
  }
}
