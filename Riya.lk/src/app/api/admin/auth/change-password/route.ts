import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError, handler, parseBody } from "@/lib/api";
import { adminChangePasswordSchema } from "@/lib/validations";
import { requireAdminApi, startAdminSession } from "@/lib/admin-auth";

/** Passwords that must never be (re)used for the admin account. */
const FORBIDDEN = new Set(["admin@123", "admin123", "password", "password123"]);

/**
 * POST /api/admin/auth/change-password
 * Also used for the forced change after the first login. Bumps the password
 * version, which invalidates every other admin session.
 */
export const POST = handler(async (req: Request) => {
  const admin = await requireAdminApi({ allowPendingPasswordChange: true });
  const { currentPassword, newPassword } = await parseBody(req, adminChangePasswordSchema);

  if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    throw new ApiError(400, "wrongPassword", { currentPassword: "wrongPassword" });
  }
  if (FORBIDDEN.has(newPassword.toLowerCase()) || newPassword.toLowerCase().includes(admin.username.toLowerCase())) {
    throw new ApiError(400, "validationFailed", { newPassword: "adminPasswordWeak" });
  }

  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 12),
      mustChangePassword: false,
      passwordVersion: { increment: 1 },
    },
  });
  // Re-issue this browser's session with the new password version.
  await startAdminSession(updated);

  return NextResponse.json({ ok: true });
});
