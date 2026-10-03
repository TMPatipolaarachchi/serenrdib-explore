import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError, getClientIp, handler, parseBody } from "@/lib/api";
import { adminLoginSchema } from "@/lib/validations";
import { assertAdminLoginAllowed, recordAdminLoginAttempt, startAdminSession } from "@/lib/admin-auth";

/**
 * Hash of a random string, compared against when the username doesn't exist so
 * both "no such user" and "wrong password" take the same time (no user enumeration).
 */
const DUMMY_HASH = "$2b$12$Fo.pdlgspBzAeSq2Rg3a1eF/ChgWZuGagAk9QdssFjrqjSdwJU6c2";

/** POST /api/admin/auth/login — rate-limited admin sign-in. */
export const POST = handler(async (req: Request) => {
  const ip = getClientIp(req.headers);
  const { username, password } = await parseBody(req, adminLoginSchema);
  const name = username.toLowerCase();

  await assertAdminLoginAllowed(ip, name);

  const admin = await prisma.admin.findUnique({ where: { username: name } });
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);

  if (!admin || !ok) {
    await recordAdminLoginAttempt(ip, name, false);
    // Small fixed delay slows scripted guessing further.
    await new Promise((r) => setTimeout(r, 400));
    throw new ApiError(401, "invalidCredentials");
  }

  await recordAdminLoginAttempt(ip, name, true);
  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date(), lastLoginIp: ip },
  });
  await startAdminSession(updated);

  return NextResponse.json({ ok: true, mustChangePassword: updated.mustChangePassword });
});
