import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { ApiError, handler, parseBody, tooManyRequests } from "@/lib/api";
import { getConversations } from "@/lib/chat";
import { rateLimit } from "@/lib/rate-limit";
import { startConversationSchema } from "@/lib/validations";

/** GET /api/conversations — the user's conversations (used for live refresh). */
export const GET = handler(async () => {
  const user = await requireApiUser();
  return NextResponse.json(await getConversations(user.id));
});

/**
 * POST /api/conversations { adId, body } — message a seller about an ad.
 * Re-uses the existing conversation for this ad if there is one.
 */
export const POST = handler(async (req: Request) => {
  const user = await requireApiUser();
  const { adId, body } = await parseBody(req, startConversationSchema);

  if (!rateLimit(`msg:${user.id}`, 30, 60_000).ok) throw tooManyRequests(60);

  const ad = await prisma.ad.findUnique({ where: { id: adId }, select: { id: true, userId: true, status: true } });
  if (!ad || ad.status !== "ACTIVE") throw new ApiError(404, "adUnavailable");
  if (ad.userId === user.id) throw new ApiError(400, "cannotChatOwnAd");

  const now = new Date();
  const conversation = await prisma.conversation.upsert({
    where: { adId_buyerId: { adId, buyerId: user.id } },
    update: { lastMessageAt: now },
    create: { adId, buyerId: user.id, sellerId: ad.userId, lastMessageAt: now },
    select: { id: true },
  });
  await prisma.message.create({ data: { conversationId: conversation.id, senderId: user.id, body } });

  return NextResponse.json({ id: conversation.id }, { status: 201 });
});
