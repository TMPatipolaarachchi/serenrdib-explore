import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { handler } from "@/lib/api";
import { countUnreadMessages } from "@/lib/chat";

/** GET /api/conversations/unread — unread message count for the header badge. */
export const GET = handler(async () => {
  const user = await getCurrentUser();
  const count = user ? await countUnreadMessages(user.id) : 0;
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
});
