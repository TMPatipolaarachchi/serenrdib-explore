/**
 * Chat queries shared by the messages pages and the chat API routes.
 */
import "server-only";
import { prisma } from "./prisma";

export interface ConversationSummary {
  id: string;
  role: "buyer" | "seller";
  otherUser: { id: string; name: string; image: string | null };
  ad: { id: string; slug: string; title: string; price: number | null; status: string; image: string | null };
  lastMessage: { body: string; createdAt: Date; fromMe: boolean } | null;
  unread: number;
  lastMessageAt: Date;
}

/** All conversations for a user, newest activity first. */
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      buyer: { select: { id: true, name: true, image: true } },
      seller: { select: { id: true, name: true, image: true } },
      ad: {
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          status: true,
          images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { readAt: null, senderId: { not: userId } } } } },
    },
  });

  return conversations.map((c) => {
    const role = c.buyerId === userId ? "buyer" : "seller";
    const last = c.messages[0];
    return {
      id: c.id,
      role,
      otherUser: role === "buyer" ? c.seller : c.buyer,
      ad: {
        id: c.ad.id,
        slug: c.ad.slug,
        title: c.ad.title,
        price: c.ad.price,
        status: c.ad.status,
        image: c.ad.images[0]?.url ?? null,
      },
      lastMessage: last ? { body: last.body, createdAt: last.createdAt, fromMe: last.senderId === userId } : null,
      unread: c._count.messages,
      lastMessageAt: c.lastMessageAt,
    };
  });
}

/** Loads a conversation if the user takes part in it, otherwise null. */
export async function getConversationForUser(id: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true, image: true } },
      seller: { select: { id: true, name: true, image: true, phone: true } },
      ad: {
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          status: true,
          images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
        },
      },
    },
  });
  if (!conversation || (conversation.buyerId !== userId && conversation.sellerId !== userId)) return null;
  return conversation;
}

export async function countUnreadMessages(userId: string) {
  return prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      conversation: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    },
  });
}
