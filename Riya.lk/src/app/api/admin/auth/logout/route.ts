import { NextResponse } from "next/server";
import { handler } from "@/lib/api";
import { endAdminSession } from "@/lib/admin-auth";

/** POST /api/admin/auth/logout */
export const POST = handler(async () => {
  await endAdminSession();
  return NextResponse.json({ ok: true });
});
