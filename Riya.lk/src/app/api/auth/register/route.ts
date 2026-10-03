import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { ApiError, getClientIp, handler, parseBody, tooManyRequests } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

/** POST /api/auth/register — create an email/password account. */
export const POST = handler(async (req: Request) => {
  const limit = rateLimit(`register:${getClientIp(req.headers)}`, 5, 60 * 60_000);
  if (!limit.ok) throw tooManyRequests(limit.retryAfterSeconds);

  const { name, email, password } = await parseBody(req, registerSchema);

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new ApiError(409, "emailTaken", { email: "emailTaken" });

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
    select: { id: true },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
});
