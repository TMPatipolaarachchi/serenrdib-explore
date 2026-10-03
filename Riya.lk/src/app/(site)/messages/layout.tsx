import type { Metadata } from "next";
import { MessagesShell } from "@/components/chat/messages-shell";
import { requireUser } from "@/lib/auth";
import { getConversations } from "@/lib/chat";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.chat.title, robots: { index: false } };
}

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/messages");
  const conversations = await getConversations(user.id);
  return <MessagesShell initial={conversations}>{children}</MessagesShell>;
}
