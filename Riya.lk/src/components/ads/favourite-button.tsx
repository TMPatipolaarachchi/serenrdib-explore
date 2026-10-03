"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Heart toggle for saving ads. Updates optimistically and rolls back on error.
 * Visitors who aren't logged in are sent to the login page.
 */
export function FavouriteButton({
  adId,
  initialSaved,
  isLoggedIn,
  variant = "overlay",
  className,
}: {
  adId: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
  variant?: "overlay" | "button";
  className?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (busy) return;

    const next = !saved;
    setSaved(next);
    setBusy(true);
    try {
      const res = next
        ? await fetch("/api/favourites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adId }),
          })
        : await fetch(`/api/favourites/${adId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(next ? t.favourites.added : t.favourites.removed);
      // On the favourites page, re-render so removed ads disappear.
      if (window.location.pathname.startsWith("/favourites")) router.refresh();
    } catch {
      setSaved(!next);
      toast.error(t.errors.network);
    } finally {
      setBusy(false);
    }
  }

  const label = saved ? t.ad.saved : t.ad.save;

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold transition hover:bg-muted",
          saved && "border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-900 dark:bg-accent-950/30 dark:text-accent-300",
          className,
        )}
      >
        <HeartIcon saved={saved} />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white dark:bg-slate-900/80 dark:text-slate-200",
        className,
      )}
    >
      <HeartIcon saved={saved} />
    </button>
  );
}

function HeartIcon({ saved }: { saved: boolean }) {
  return (
    <motion.span key={String(saved)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
      <Heart className={cn("size-[18px]", saved && "fill-accent-500 text-accent-500")} />
    </motion.span>
  );
}
