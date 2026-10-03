import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { handler, notFound, parseBody, tooManyRequests } from "@/lib/api";
import { getConversationForUser } from "@/lib/chat";
import { rateLimit } from "@/lib/rate-limit";
import { messageSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

const messageSelect = { id: true, body: true, senderId: true, createdAt: true, readAt: true } as const;

/**
 * GET /api/conversations/:id/messages[?after=ISO date]
 * Returns messages (only newer ones when `after` is given — used for polling)
 * and marks the other person's messages as read.
 */
export const GET = handler(async (req: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireApiUser();
  const conversation = await getConversationForUser(id, user.id);
  if (!conversation) throw notFound();

  const afterParam = req.nextUrl.searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : null;

  const messages = await prisma.message.findMany({
    where: { conversationId: id, ...(after && !Number.isNaN(after.getTime()) ? { createdAt: { gt: after } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 500,
    select: messageSelect,
  });

  await prisma.message.updateMany({
    where: { conversationId: id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json(messages, { headers: { "Cache-Control": "no-store" } });
});

/** POST /api/conversations/:id/messages { body } — send a message. */
export const POST = handler(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireApiUser();
  if (!rateLimit(`msg:${user.id}`, 30, 60_000).ok) throw tooManyRequests(60);

  const conversation = await getConversationForUser(id, user.id);
  if (!conversation) throw notFound();
  const { body } = await parseBody(req, messageSchema);

  const [message] = await prisma.$transaction([
    prisma.message.create({ data: { conversationId: id, senderId: user.id, body }, select: messageSelect }),
    prisma.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } }),
  ]);
  return NextResponse.json(message, { status: 201 });
});
