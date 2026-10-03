/**
 * Next.js 16 "proxy" (formerly middleware). Runs before rendering and handles:
 *
 * 1. Admin area guard
 *    • /admin/login and the login API are public.
 *    • Everything else under /admin and /api/admin needs a valid admin session
 *      cookie. Pages redirect to /admin/login; APIs get a 401 JSON response.
 *    • While the admin still has to change the initial password, only the
 *      change-password page/API and logout are reachable.
 *    This is the first line of defence only — every admin page and API route
 *    also re-checks the session against the database (src/lib/admin-auth.ts).
 *
 * 2. Signed-in user pages (/post-ad, /my-ads, …) → real 307 redirect to /login
 *    for visitors (pages also re-check, e.g. for banned accounts).
 *
 * 3. /search?category=cars → /category/cars (one canonical, SEO-friendly URL).
 */
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-jwt";

const ADMIN_PUBLIC = new Set(["/admin/login", "/api/admin/auth/login"]);
const ALLOWED_BEFORE_PASSWORD_CHANGE = new Set([
  "/admin/change-password",
  "/api/admin/auth/change-password",
  "/api/admin/auth/logout",
]);
const USER_PAGES = ["/post-ad", "/my-ads", "/favourites", "/messages", "/profile", "/verify-phone"];

/** Admin responses must never be cached or indexed. */
function harden(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

async function adminGuard(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const session = await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);

  if (ADMIN_PUBLIC.has(pathname)) {
    // Already signed in? Skip the login page.
    if (session && pathname === "/admin/login") {
      return harden(NextResponse.redirect(new URL(session.mcp ? "/admin/change-password" : "/admin", req.url)));
    }
    return harden(NextResponse.next());
  }

  if (!session) {
    if (isApi) return harden(NextResponse.json({ error: "unauthorized" }, { status: 401 }));
    const res = NextResponse.redirect(new URL("/admin/login", req.url));
    res.cookies.delete(ADMIN_COOKIE); // drop expired/tampered cookies
    return harden(res);
  }

  if (session.mcp && !ALLOWED_BEFORE_PASSWORD_CHANGE.has(pathname)) {
    if (isApi) return harden(NextResponse.json({ error: "passwordChangeRequired" }, { status: 403 }));
    return harden(NextResponse.redirect(new URL("/admin/change-password", req.url)));
  }

  return harden(NextResponse.next());
}

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/")) {
    return adminGuard(req);
  }

  if (pathname === "/search" && searchParams.get("category")) {
    const url = req.nextUrl.clone();
    url.pathname = `/category/${encodeURIComponent(searchParams.get("category")!)}`;
    url.searchParams.delete("category");
    return NextResponse.redirect(url, 308);
  }

  if (USER_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/search",
    "/post-ad",
    "/my-ads/:path*",
    "/favourites",
    "/messages/:path*",
    "/profile",
    "/verify-phone",
  ],
};
