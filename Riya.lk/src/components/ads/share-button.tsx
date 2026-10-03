"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/client";

/** Uses the native share sheet on phones, otherwise copies the link. */
export function ShareButton({ title, url }: { title: string; url: string }) {
  const { t } = useI18n();

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* cancelled — fall through to copy */
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success(t.common.linkCopied);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-brand-700 dark:hover:text-brand-300"
    >
      <Share2 className="size-4" />
      {t.common.share}
    </button>
  );
}
