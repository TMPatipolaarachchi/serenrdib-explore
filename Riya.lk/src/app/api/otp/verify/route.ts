import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { handler, parseBody } from "@/lib/api";
import { verifyOtp } from "@/lib/otp";
import { verifyOtpSchema } from "@/lib/validations";

/** POST /api/otp/verify — check the code and mark the phone as verified. */
export const POST = handler(async (req: Request) => {
  const user = await requireApiUser();
  const { phone, code } = await parseBody(req, verifyOtpSchema);
  await verifyOtp(user.id, phone, code);
  return NextResponse.json({ ok: true, phone });
});
