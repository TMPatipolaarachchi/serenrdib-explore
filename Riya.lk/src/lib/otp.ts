/**
 * Phone number verification with one-time codes.
 *
 *  • 6-digit codes, valid for 10 minutes
 *  • only an HMAC of the code is stored
 *  • max 5 wrong guesses per code, 60s resend cooldown, 5 codes per hour
 *  • a number can only be verified on one account at a time
 */
import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";
import { ApiError, tooManyRequests } from "./api";
import { sendSms, smsProvider } from "./sms";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_CODES_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

function hashCode(userId: string, phone: string, code: string) {
  const secret = process.env.OTP_SECRET || process.env.NEXTAUTH_SECRET || "riya-otp";
  return createHmac("sha256", secret).update(`${userId}:${phone}:${code}`).digest("hex");
}

async function assertPhoneAvailable(userId: string, phone: string) {
  const taken = await prisma.user.findFirst({
    where: { phone, phoneVerifiedAt: { not: null }, id: { not: userId } },
    select: { id: true },
  });
  if (taken) throw new ApiError(409, "phoneInUse", { phone: "phoneInUse" });
}

/**
 * Creates a code and sends it by SMS.
 * In development with the console provider the code is also returned so it can
 * be shown on screen (never in production).
 */
export async function sendOtp(userId: string, phone: string): Promise<{ devCode?: string }> {
  await assertPhoneAvailable(userId, phone);

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.otpCode.findMany({
    where: { userId, createdAt: { gte: hourAgo } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const last = recent[0];
  if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw tooManyRequests((RESEND_COOLDOWN_MS - (Date.now() - last.createdAt.getTime())) / 1000, "otpCooldown");
  }
  if (recent.length >= MAX_CODES_PER_HOUR) throw tooManyRequests(60 * 60, "otpHourlyLimit");

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await prisma.otpCode.create({
    data: {
      userId,
      phone,
      codeHash: hashCode(userId, phone, code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  await sendSms(phone, `Your Riya.lk verification code is ${code}. It expires in 10 minutes. Do not share this code.`);

  const exposeCode = process.env.NODE_ENV !== "production" && smsProvider() === "console";
  return exposeCode ? { devCode: code } : {};
}

/** Checks a code and, if correct, marks the user's phone as verified. */
export async function verifyOtp(userId: string, phone: string, code: string) {
  const otp = await prisma.otpCode.findFirst({
    where: { userId, phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.expiresAt < new Date()) throw new ApiError(400, "codeExpired", { code: "codeExpired" });
  if (otp.attempts >= MAX_ATTEMPTS) throw new ApiError(429, "tooManyAttempts", { code: "tooManyAttempts" });

  const expected = Buffer.from(otp.codeHash, "hex");
  const actual = Buffer.from(hashCode(userId, phone, code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new ApiError(400, "invalidCode", { code: "invalidCode" });
  }

  await assertPhoneAvailable(userId, phone);

  await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({ where: { id: userId }, data: { phone, phoneVerifiedAt: new Date() } }),
  ]);
}
