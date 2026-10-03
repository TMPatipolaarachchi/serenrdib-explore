/**
 * Admin session tokens (signed JWTs in an httpOnly cookie).
 *
 * This file only depends on `jose` so it can be imported from `src/proxy.ts`
 * without pulling Prisma into the proxy bundle.
 */
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "riya_admin_session";
export const ADMIN_SESSION_HOURS = 8;

export interface AdminTokenPayload {
  /** Admin id */
  sub: string;
  username: string;
  /** "must change password" — forces /admin/change-password */
  mcp: boolean;
  /** Password version — tokens issued before a password change become invalid. */
  pv: number;
}

function secretKey() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("ADMIN_JWT_SECRET (or NEXTAUTH_SECRET) must be set.");
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT({ username: payload.username, mcp: payload.mcp, pv: payload.pv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer("riya-admin")
    .setAudience("riya-admin")
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_HOURS}h`)
    .sign(secretKey());
}

export async function verifyAdminToken(token: string | undefined): Promise<AdminTokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: "riya-admin",
      audience: "riya-admin",
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      username: String(payload.username ?? ""),
      mcp: Boolean(payload.mcp),
      pv: Number(payload.pv ?? 0),
    };
  } catch {
    return null;
  }
}
