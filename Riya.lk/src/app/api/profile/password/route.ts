import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { ApiError, handler, parseBody } from "@/lib/api";
import { changePasswordSchema } from "@/lib/validations";

/**
 * POST /api/profile/password — change (or, for Google-only accounts, set) the password.
 */
export const POST = handler(async (req: Request) => {
  const user = await requireApiUser();
  const { currentPassword, newPassword } = await parseBody(req, changePasswordSchema);

  if (user.passwordHash) {
    const ok = currentPassword && (await bcrypt.compare(currentPassword, user.passwordHash));
    if (!ok) throw new ApiError(400, "wrongPassword", { currentPassword: "wrongPassword" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });
  return NextResponse.json({ ok: true });
});
