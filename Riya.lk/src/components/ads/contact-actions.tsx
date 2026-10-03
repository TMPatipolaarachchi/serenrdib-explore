"use client";

/**
 * Call / WhatsApp / Chat buttons for an ad.
 * The phone number is hidden until "Show number" is tapped (reduces scraping).
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonClass } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/form";
import { WhatsappIcon } from "@/components/layout/social-icons";
import { useErrorText, useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { cn, formatPhone, maskPhone, whatsappNumber } from "@/lib/utils";

export function ContactActions({
  adId,
  adTitle,
  adUrl,
  phone,
  isOwner,
  isLoggedIn,
  canContact,
  className,
}: {
  adId: string;
  adTitle: string;
  adUrl: string;
  phone: string;
  isOwner: boolean;
  isLoggedIn: boolean;
  /** False for sold/pending ads — contact buttons are hidden. */
  canContact: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState(t.chat.defaultMessage);
  const [sending, setSending] = useState(false);

  if (isOwner || !canContact) return null;

  const waText = fmt(t.ad.whatsappMessage, { title: adTitle, url: adUrl });
  const waHref = `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(waText)}`;

  async function startChat() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId, body: message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/messages/${data.id}`);
    } catch (err) {
      toast.error(errorText(err instanceof Error ? err.message : "") ?? t.errors.serverError);
      setSending(false);
    }
  }

  return (
    <div className={cn("grid gap-2.5", className)}>
      {revealed ? (
        <a href={`tel:${phone}`} className={buttonClass({ variant: "secondary", size: "lg", className: "w-full" })}>
          <Phone className="size-5" />
          {formatPhone(phone)}
        </a>
      ) : (
        <Button variant="secondary" size="lg" className="w-full" onClick={() => setRevealed(true)}>
          <Phone className="size-5" />
          <span>{t.ad.showNumber}</span>
          <span className="font-mono text-sm opacity-70">{maskPhone(phone)}</span>
        </Button>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <a href={waHref} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: "whatsapp", size: "lg" })}>
          <WhatsappIcon className="size-5" />
          {t.ad.whatsapp}
        </a>
        {isLoggedIn ? (
          <Button size="lg" onClick={() => setChatOpen(true)}>
            <MessageCircle className="size-5" />
            {t.ad.chat}
          </Button>
        ) : (
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(new URL(adUrl).pathname)}`}
            className={buttonClass({ size: "lg" })}
            title={t.chat.loginToChat}
          >
            <MessageCircle className="size-5" />
            {t.ad.chat}
          </Link>
        )}
      </div>

      <Modal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title={t.chat.startTitle}
        footer={
          <Button className="w-full" size="lg" loading={sending} onClick={startChat}>
            <Send className="size-4" />
            {t.chat.send}
          </Button>
        }
      >
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{adTitle}</p>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={2000} autoFocus />
      </Modal>
    </div>
  );
}
