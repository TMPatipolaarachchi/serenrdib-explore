import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Riya.lk wordmark. "Riya" (රිය) means "vehicle" in Sinhala.
 * If an admin uploads a logo in Site settings, that image is used instead.
 */
export function Logo({ logoUrl, className, light }: { logoUrl?: string | null; className?: string; light?: boolean }) {
  if (logoUrl) {
    return (
      <span className={cn("relative block h-9 w-32", className)}>
        <Image src={logoUrl} alt="Riya.lk" fill sizes="128px" className="object-contain object-left" priority />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="size-9" />
      <span className={cn("text-[1.35rem] leading-none font-extrabold tracking-tight", light ? "text-white" : "text-brand-900 dark:text-white")}>
        Riya<span className="text-accent-500">.lk</span>
      </span>
    </span>
  );
}

/** The square brand mark: a road curving into a wheel. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="riya-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2149e8" />
          <stop offset="1" stopColor="#0f2468" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#riya-g)" />
      <path d="M9 27.5c3.5-9 9-13.5 16.5-14.5" stroke="#ff6a0c" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <circle cx="26.5" cy="25.5" r="5.2" stroke="#fff" strokeWidth="2.6" fill="none" />
      <circle cx="26.5" cy="25.5" r="1.6" fill="#fff" />
    </svg>
  );
}
