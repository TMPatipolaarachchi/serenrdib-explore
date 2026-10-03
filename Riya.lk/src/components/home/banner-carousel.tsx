"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useInterval } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

/** Auto-rotating promotional banners managed in /admin/settings. */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  useInterval(() => setIndex((i) => (i + 1) % banners.length), 6000, banners.length > 1);

  const banner = banners[index]!;
  const content = (
    <>
      <Image src={banner.imageUrl} alt={banner.title ?? ""} fill sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />
      {(banner.title || banner.subtitle) && (
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent p-5 text-white sm:p-8">
          {banner.title && <h3 className="text-xl font-bold sm:text-3xl">{banner.title}</h3>}
          {banner.subtitle && <p className="mt-1 max-w-xl text-sm text-white/85 sm:text-base">{banner.subtitle}</p>}
        </div>
      )}
    </>
  );

  return (
    <div className="relative aspect-[16/7] overflow-hidden rounded-3xl bg-muted shadow-lg sm:aspect-[16/5]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {banner.linkUrl ? (
            <a href={banner.linkUrl} className="absolute inset-0">
              {content}
            </a>
          ) : (
            content
          )}
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <div className="absolute right-4 bottom-4 flex gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Banner ${i + 1}`}
              className={cn("h-2 rounded-full bg-white/60 transition-all", i === index ? "w-6 bg-white" : "w-2")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
