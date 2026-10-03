import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { handler, parseBody } from "@/lib/api";
import { sendOtp } from "@/lib/otp";
import { sendOtpSchema } from "@/lib/validations";

/** POST /api/otp/send — send a verification code to the given phone. */
export const POST = handler(async (req: Request) => {
  const user = await requireApiUser();
  const { phone } = await parseBody(req, sendOtpSchema);
  const result = await sendOtp(user.id, phone);
  return NextResponse.json({ ok: true, phone, ...result });
});
