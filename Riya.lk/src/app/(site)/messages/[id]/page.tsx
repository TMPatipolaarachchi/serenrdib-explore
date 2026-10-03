import { notFound } from "next/navigation";
import { ChatThread } from "@/components/chat/chat-thread";
import { requireUser } from "@/lib/auth";
import { getConversationForUser } from "@/lib/chat";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);
  const conversation = await getConversationForUser(id, user.id);
  if (!conversation) notFound();

  const [messages] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      take: 500,
      select: { id: true, body: true, senderId: true, createdAt: true, readAt: true },
    }),
    // Opening the conversation marks the other person's messages as read.
    prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: user.id }, readAt: null },
      data: { readAt: new Date() },
    }),
  ]);

  const isBuyer = conversation.buyerId === user.id;
  const other = isBuyer ? conversation.seller : conversation.buyer;

  return (
    <ChatThread
      key={id}
      conversationId={id}
      currentUserId={user.id}
      otherUser={{ name: other.name, image: other.image }}
      ad={{
        slug: conversation.ad.slug,
        title: conversation.ad.title,
        price: conversation.ad.price,
        status: conversation.ad.status,
        image: conversation.ad.images[0]?.url ?? null,
      }}
      sellerPhone={isBuyer && conversation.ad.status === "ACTIVE" ? conversation.seller.phone : null}
      initialMessages={messages}
    />
  );
}
