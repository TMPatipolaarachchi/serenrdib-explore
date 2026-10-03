"use client";

/**
 * Accessible animated modal. On phones it slides up as a bottom sheet;
 * on larger screens it's a centred dialog. Closes on Escape or backdrop click.
 */
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useIsClient } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  side,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /** Render as a full-height drawer from the given side instead of a dialog. */
  side?: "left" | "right";
}) {
  const titleId = useId();
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!isClient) return null;

  const widths = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl" };

  const panel = side ? (
    <motion.div
      key="drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      initial={{ x: side === "left" ? "-100%" : "100%" }}
      animate={{ x: 0 }}
      exit={{ x: side === "left" ? "-100%" : "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className={cn(
        "fixed inset-y-0 z-50 flex w-[88vw] max-w-sm flex-col bg-card shadow-2xl",
        side === "left" ? "left-0" : "right-0",
      )}
    >
      <ModalHeader title={title} titleId={titleId} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="border-t border-border px-5 py-4">{footer}</div>}
    </motion.div>
  ) : (
    <motion.div
      key="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.98 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-3xl bg-card shadow-2xl",
        "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
        widths[size],
      )}
    >
      <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden />
      <ModalHeader title={title} titleId={titleId} onClose={onClose} />
      <div className="overflow-y-auto px-5 pb-5">{children}</div>
      {footer && <div className="border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
    </motion.div>
  );

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {panel}
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ModalHeader({ title, titleId, onClose }: { title?: React.ReactNode; titleId: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3">
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="-mr-2 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
