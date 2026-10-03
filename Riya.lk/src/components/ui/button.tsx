import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-accent-500 text-white shadow-sm shadow-accent-500/30 hover:bg-accent-600 active:bg-accent-700 disabled:bg-accent-500/60",
  secondary:
    "bg-brand-900 text-white shadow-sm hover:bg-brand-800 active:bg-brand-950 dark:bg-brand-600 dark:hover:bg-brand-500",
  outline: "border border-border bg-card text-foreground hover:bg-muted active:bg-muted/80",
  ghost: "text-foreground hover:bg-muted active:bg-muted/80",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
  success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800",
  whatsapp: "bg-[#25D366] text-white shadow-sm hover:bg-[#1ebe5b] active:bg-[#18a84f]",
} as const;

// Minimum (not fixed) heights so long Sinhala/Tamil labels can wrap instead of
// overflowing narrow phone screens.
const sizes = {
  sm: "min-h-9 gap-1.5 rounded-lg px-3 py-1.5 text-sm",
  md: "min-h-11 gap-2 rounded-xl px-5 py-2 text-sm",
  lg: "min-h-12 gap-2 rounded-xl px-6 py-2.5 text-base",
  icon: "size-10 rounded-xl",
  "icon-sm": "size-8 rounded-lg",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/** Class names for a button — also used to style <Link>s as buttons. */
export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "inline-flex max-w-full shrink-0 select-none items-center justify-center text-center leading-tight font-semibold transition-all duration-150 [&_svg]:shrink-0",
    "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60",
    "active:scale-[0.98]",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

export function Button({ variant, size, loading, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
