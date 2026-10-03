"use client";

/**
 * Photo uploader for the ad form.
 *  • compresses each photo in the browser (max 1920px, ~1 MB JPEG) before upload
 *  • uploads in parallel with progress bars
 *  • reorder (← →), set cover, remove
 * The first photo is the cover image.
 */
import { useRef, useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { useErrorText, useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { MAX_AD_IMAGES } from "@/lib/constants";
import type { AdImageInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

type Item =
  | { key: string; status: "done"; image: AdImageInput }
  | { key: string; status: "uploading"; preview: string; progress: number };

/** Uploads one file to /api/upload with progress reporting. */
function uploadFile(file: Blob, name: string, onProgress: (fraction: number) => void): Promise<AdImageInput> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let data: { error?: string } & Partial<AdImageInput> = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve(data as AdImageInput);
      else reject(new Error(data.error || "serverError"));
    };
    xhr.onerror = () => reject(new Error("network"));
    const form = new FormData();
    form.append("file", file, name);
    xhr.send(form);
  });
}

export function ImageUploader({
  value,
  onChange,
  invalid,
}: {
  value: AdImageInput[];
  onChange: (images: AdImageInput[]) => void;
  invalid?: boolean;
}) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // `itemsRef` is the source of truth so parallel uploads don't overwrite each other.
  const [items, setItems] = useState<Item[]>(() => value.map((image) => ({ key: image.url, status: "done", image })));
  const itemsRef = useRef(items);

  function update(fn: (prev: Item[]) => Item[]) {
    const next = fn(itemsRef.current);
    itemsRef.current = next;
    setItems(next);
    onChange(next.flatMap((i) => (i.status === "done" ? [i.image] : [])));
  }

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const room = MAX_AD_IMAGES - itemsRef.current.length;
    if (files.length > room) toast.warning(fmt(t.postAd.maxPhotosReached, { max: MAX_AD_IMAGES }));

    await Promise.all(
      files.slice(0, Math.max(0, room)).map(async (file) => {
        const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
        const preview = URL.createObjectURL(file);
        update((prev) => [...prev, { key, status: "uploading", preview, progress: 0 }]);

        try {
          const compressed = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: "image/jpeg",
            initialQuality: 0.82,
          });
          const image = await uploadFile(compressed, file.name.replace(/\.\w+$/, "") + ".jpg", (p) =>
            update((prev) => prev.map((i) => (i.key === key && i.status === "uploading" ? { ...i, progress: p } : i))),
          );
          update((prev) => prev.map((i) => (i.key === key ? { key, status: "done", image } : i)));
        } catch (err) {
          update((prev) => prev.filter((i) => i.key !== key));
          const reason = errorText(err instanceof Error ? err.message : "");
          toast.error(`${fmt(t.postAd.uploadFailed, { name: file.name })}${reason ? ` — ${reason}` : ""}`);
        } finally {
          URL.revokeObjectURL(preview);
        }
      }),
    );
  }

  function move(index: number, to: number) {
    update((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(to, 0, item!);
      return next;
    });
  }

  const full = items.length >= MAX_AD_IMAGES;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.div
              key={item.key}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-2xl border bg-muted",
                i === 0 ? "border-accent-400 ring-2 ring-accent-400/40" : "border-border",
              )}
            >
              {item.status === "done" ? (
                <Image src={item.image.url} alt="" fill sizes="200px" className="object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={item.preview} alt="" className="size-full object-cover opacity-50" />
              )}

              {item.status === "uploading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/30 text-white">
                  <Loader2 className="size-6 animate-spin" />
                  <div className="h-1.5 w-3/4 overflow-hidden rounded-full bg-white/30">
                    <div className="h-full bg-accent-500 transition-all" style={{ width: `${Math.round(item.progress * 100)}%` }} />
                  </div>
                </div>
              )}

              {i === 0 && item.status === "done" && (
                <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                  <Star className="size-2.5 fill-current" /> {t.postAd.cover}
                </span>
              )}

              {item.status === "done" && (
                <>
                  <button
                    type="button"
                    onClick={() => update((prev) => prev.filter((x) => x.key !== item.key))}
                    className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-slate-950/70 text-white transition hover:bg-red-600"
                    aria-label={t.postAd.remove}
                  >
                    <X className="size-4" />
                  </button>
                  <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => move(i, i - 1)}
                      className="flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow disabled:invisible"
                      aria-label={t.postAd.moveLeft}
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    {i !== 0 && (
                      <button
                        type="button"
                        onClick={() => move(i, 0)}
                        className="rounded-full bg-white/90 px-2 text-[10px] font-bold text-slate-800 shadow"
                      >
                        {t.postAd.makeCover}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={i === items.length - 1}
                      onClick={() => move(i, i + 1)}
                      className="flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow disabled:invisible"
                      aria-label={t.postAd.moveRight}
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed p-2 text-center text-xs font-medium transition",
              dragging
                ? "border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-950/30"
                : invalid
                  ? "border-red-400 text-red-600"
                  : "border-border text-muted-foreground hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-700 dark:hover:bg-brand-950/40",
              items.length === 0 && "col-span-3 aspect-auto py-10 sm:col-span-4 lg:col-span-5",
            )}
          >
            <ImagePlus className={items.length === 0 ? "size-9" : "size-6"} />
            <span>{items.length === 0 ? t.postAd.dropHere : t.postAd.addPhotos}</span>
            <span className="text-[11px] opacity-70">
              {items.length}/{MAX_AD_IMAGES}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
