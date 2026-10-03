"use client";

/**
 * Photo gallery: swipeable on phones (CSS scroll-snap), arrows + thumbnails on
 * desktop, and a full-screen viewer.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { useIsClient } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function AdGallery({ images, title, icon }: { images: { url: string }[]; title: string; icon: string }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();

  const go = useCallback(
    (i: number) => {
      const next = (i + images.length) % images.length;
      setIndex(next);
      const el = track.current;
      if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    },
    [images.length],
  );

  // Keep the index in sync when the user swipes.
  function onScroll() {
    const el = track.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  }

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen, images.length]);

  if (!images.length) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-300 dark:from-brand-950 dark:to-slate-900 dark:text-brand-800">
        <CategoryIcon icon={icon} className="size-20" strokeWidth={1.2} />
        <span className="text-sm font-medium text-muted-foreground">{t.ad.noPhotos}</span>
      </div>
    );
  }

  const arrow =
    "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white sm:flex";

  return (
    <div className="space-y-3">
      <div className="group relative overflow-hidden rounded-3xl bg-slate-950">
        <div ref={track} onScroll={onScroll} className="no-scrollbar flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setFullscreen(true)}
              className="relative h-full w-full shrink-0 snap-center"
              aria-label={`${title} – ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={`${title} – ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-contain"
              />
            </button>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} className={cn(arrow, "left-3")} aria-label={t.common.previous}>
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => go(index + 1)} className={cn(arrow, "right-3")} aria-label={t.common.next}>
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        <div className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-2">
          <span className="rounded-full bg-slate-950/65 px-2.5 py-1 text-xs font-semibold text-white">
            {index + 1} / {images.length}
          </span>
          <span className="rounded-full bg-slate-950/65 p-1.5 text-white">
            <Expand className="size-3.5" />
          </span>
        </div>
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto" aria-label={fmt(t.ad.photoCount, { count: images.length })}>
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => go(i)}
              className={cn(
                "relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition sm:w-24",
                i === index ? "ring-accent-500" : "opacity-70 ring-transparent hover:opacity-100",
              )}
              aria-label={`${i + 1}`}
              aria-current={i === index}
            >
              <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {isClient &&
        createPortal(
          <AnimatePresence>
            {fullscreen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/95"
                role="dialog"
                aria-modal="true"
                aria-label={title}
              >
                <button
                  type="button"
                  onClick={() => setFullscreen(false)}
                  className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
                  aria-label={t.common.close}
                >
                  <X className="size-6" />
                </button>
                <motion.div key={index} initial={{ opacity: 0.4, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative h-[85dvh] w-full">
                  <Image src={images[index]!.url} alt={title} fill sizes="100vw" className="object-contain" />
                </motion.div>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                      aria-label={t.common.previous}
                    >
                      <ChevronLeft className="size-6" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIndex((i) => (i + 1) % images.length)}
                      className="absolute right-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                      aria-label={t.common.next}
                    >
                      <ChevronRight className="size-6" />
                    </button>
                  </>
                )}
                <span className="absolute bottom-5 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                  {index + 1} / {images.length}
                </span>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
