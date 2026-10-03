"use client";

/**
 * Two-pane messages layout: conversation list + open thread on desktop,
 * one pane at a time on phones.
 */
import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { timeAgo } from "@/lib/i18n/config";
import { useInterval } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export interface ConversationItem {
  id: string;
  role: "buyer" | "seller";
  otherUser: { id: string; name: string; image: string | null };
  ad: { id: string; slug: string; title: string; price: number | null; status: string; image: string | null };
  lastMessage: { body: string; createdAt: Date | string; fromMe: boolean } | null;
  unread: number;
  lastMessageAt: Date | string;
}

export function MessagesShell({ initial, children }: { initial: ConversationItem[]; children: React.ReactNode }) {
  const { t, locale } = useI18n();
  const activeId = useSelectedLayoutSegment();
  const [conversations, setConversations] = useState(initial);

  // Refresh the list (new conversations, unread counts) every 15 seconds.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (res.ok) setConversations(await res.json());
    } catch {
      /* offline */
    }
  }, []);
  useInterval(refresh, 15_000);

  return (
    <div className="mx-auto w-full max-w-7xl px-0 sm:px-6 sm:py-6 lg:px-8">
      <div className="grid h-[calc(100dvh-4rem-4.5rem-env(safe-area-inset-bottom))] overflow-hidden border-border bg-card sm:h-[calc(100dvh-4rem-4.5rem-3rem)] sm:rounded-3xl sm:border sm:shadow-sm lg:h-[calc(100dvh-4rem-3rem)] lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Conversation list */}
        <aside className={cn("flex min-h-0 flex-col border-border lg:border-r", activeId && "hidden lg:flex")}>
          <div className="border-b border-border px-5 py-4">
            <h1 className="text-xl font-bold">{t.chat.title}</h1>
          </div>
          {conversations.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<MessagesSquare className="size-6" />}
                title={t.chat.emptyTitle}
                text={t.chat.emptyText}
                className="border-0"
                action={
                  <Link href="/search" className={buttonClass({ size: "sm" })}>
                    {t.favourites.browse}
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/messages/${c.id}`}
                    onClick={() => setConversations((list) => list.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)))}
                    className={cn(
                      "flex gap-3 border-b border-border/60 px-4 py-3.5 transition hover:bg-muted/60",
                      activeId === c.id && "bg-brand-50 dark:bg-brand-950/50",
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="relative size-14 overflow-hidden rounded-xl bg-muted">
                        {c.ad.image && <Image src={c.ad.image} alt="" fill sizes="56px" className="object-cover" />}
                      </div>
                      <Avatar name={c.otherUser.name} src={c.otherUser.image} size={26} className="absolute -right-1.5 -bottom-1.5 ring-2 ring-card" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("truncate text-sm", c.unread ? "font-bold" : "font-semibold")}>{c.otherUser.name}</p>
                        <span className="shrink-0 text-[11px] text-muted-foreground" suppressHydrationWarning>
                          {timeAgo(c.lastMessageAt, locale)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className={cn("mr-1 font-semibold", c.role === "buyer" ? "text-brand-600 dark:text-brand-300" : "text-accent-600")}>
                          {c.role === "buyer" ? t.chat.buying : t.chat.selling}
                        </span>
                        · {c.ad.title}
                      </p>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className={cn("truncate text-sm", c.unread ? "font-semibold text-foreground" : "text-muted-foreground")}>
                          {c.lastMessage ? `${c.lastMessage.fromMe ? `${t.chat.you}: ` : ""}${c.lastMessage.body}` : ""}
                        </p>
                        {c.unread > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[11px] font-bold text-white">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Open conversation */}
        <section className={cn("min-h-0", !activeId && "hidden lg:block")}>{children}</section>
      </div>
    </div>
  );
}
