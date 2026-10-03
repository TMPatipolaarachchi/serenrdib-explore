"use client";

/**
 * A single conversation. New messages are fetched every 4 seconds while the
 * tab is visible (lightweight polling — works on any hosting, no websockets).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, CheckCheck, Loader2, Phone, SendHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { useErrorText, useI18n } from "@/lib/i18n/client";
import { LOCALE_TAGS } from "@/lib/i18n/config";
import { useInterval } from "@/lib/hooks";
import { cn, formatPrice } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date | string;
  readAt: Date | string | null;
  pending?: boolean;
  failed?: boolean;
}

export function ChatThread({
  conversationId,
  currentUserId,
  otherUser,
  ad,
  sellerPhone,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherUser: { name: string; image: string | null };
  ad: { slug: string; title: string; price: number | null; status: string; image: string | null };
  /** Shown to the buyer as a quick "call" shortcut. */
  sellerPhone: string | null;
  initialMessages: ChatMessage[];
}) {
  const { t, locale } = useI18n();
  const errorText = useErrorText();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastServerAt = useRef(initialMessages.at(-1)?.createdAt ?? null);

  const poll = useCallback(async () => {
    try {
      const after = lastServerAt.current ? `?after=${encodeURIComponent(new Date(lastServerAt.current).toISOString())}` : "";
      const res = await fetch(`/api/conversations/${conversationId}/messages${after}`, { cache: "no-store" });
      if (!res.ok) return;
      const fresh: ChatMessage[] = await res.json();
      if (!fresh.length) return;
      lastServerAt.current = fresh.at(-1)!.createdAt;
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        return [...prev, ...fresh.filter((m) => !known.has(m.id))];
      });
    } catch {
      /* offline — try again next tick */
    }
  }, [conversationId]);
  useInterval(poll, 4000);

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setText("");
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, body, senderId: currentUserId, createdAt: new Date().toISOString(), readAt: null, pending: true },
    ]);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      lastServerAt.current = data.createdAt;
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
      setText(body);
      console.warn(errorText(err instanceof Error ? err.message : ""));
    }
  }

  const time = (d: Date | string) =>
    new Intl.DateTimeFormat(LOCALE_TAGS[locale], { hour: "numeric", minute: "2-digit" }).format(new Date(d));
  const day = (d: Date | string) =>
    new Intl.DateTimeFormat(LOCALE_TAGS[locale], { weekday: "short", month: "short", day: "numeric" }).format(new Date(d));

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-3 py-3 sm:px-5">
        <Link href="/messages" className="rounded-full p-2 text-muted-foreground hover:bg-muted lg:hidden" aria-label={t.common.back}>
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar name={otherUser.name} src={otherUser.image} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{otherUser.name}</p>
          <Link href={`/ads/${ad.slug}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            {ad.image && (
              <span className="relative size-5 shrink-0 overflow-hidden rounded">
                <Image src={ad.image} alt="" fill sizes="20px" className="object-cover" />
              </span>
            )}
            <span className="truncate">{ad.title}</span>
            {ad.price != null && <span className="shrink-0 font-semibold text-accent-600">{formatPrice(ad.price)}</span>}
          </Link>
        </div>
        {sellerPhone && (
          <a href={`tel:${sellerPhone}`} className="rounded-full p-2.5 text-brand-700 hover:bg-muted dark:text-brand-300" aria-label={t.ad.call}>
            <Phone className="size-5" />
          </a>
        )}
      </div>

      {ad.status !== "ACTIVE" && (
        <p className="bg-amber-50 px-5 py-2 text-center text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {ad.status === "SOLD" ? t.ad.soldNotice : t.chat.adRemoved}
        </p>
      )}

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-muted/40 px-3 py-4 sm:px-6">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{t.chat.noMessages}</p>}
        {messages.map((m, i) => {
          const mine = m.senderId === currentUserId;
          const showDay = i === 0 || day(messages[i - 1]!.createdAt) !== day(m.createdAt);
          return (
            <div key={m.id}>
              {showDay && (
                <p className="my-3 text-center text-[11px] font-medium text-muted-foreground" suppressHydrationWarning>
                  {day(m.createdAt)}
                </p>
              )}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed shadow-sm sm:max-w-[65%]",
                    mine ? "rounded-br-md bg-brand-900 text-white dark:bg-brand-600" : "rounded-bl-md bg-card",
                    m.failed && "bg-red-600 dark:bg-red-700",
                  )}
                >
                  <p className="break-words whitespace-pre-wrap">{m.body}</p>
                  <p className={cn("mt-0.5 flex items-center justify-end gap-1 text-[10px]", mine ? "text-white/70" : "text-muted-foreground")}>
                    <span suppressHydrationWarning>{time(m.createdAt)}</span>
                    {mine &&
                      (m.pending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : m.failed ? (
                        "!"
                      ) : m.readAt ? (
                        <CheckCheck className="size-3.5" />
                      ) : (
                        <Check className="size-3.5" />
                      ))}
                  </p>
                </div>
              </div>
              {m.failed && <p className="mt-1 text-right text-xs text-red-600">{t.chat.sendFailed}</p>}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2 border-t border-border bg-card p-3"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={t.chat.typeMessage}
          aria-label={t.chat.typeMessage}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-muted/60 px-4 py-2.5 text-[15px] focus:border-brand-500 focus:bg-card focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white shadow-md shadow-accent-500/30 transition hover:bg-accent-600 disabled:opacity-40"
          aria-label={t.chat.send}
        >
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </div>
  );
}
