/**
 * Form primitives: Field (label + hint + error), Input, Textarea, Select, Checkbox.
 * Styled once here so every form in the app looks the same.
 */
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-xl border border-border bg-card px-3.5 text-[15px] text-foreground shadow-xs transition-colors " +
  "placeholder:text-muted-foreground/70 hover:border-brand-300 dark:hover:border-brand-700 " +
  "focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/15";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  optionalLabel,
  className,
  children,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  /** Text shown after optional fields, e.g. "Optional". */
  optionalLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-accent-500">*</span>}
          {!required && optionalLabel && (
            <span className="text-xs font-normal text-muted-foreground">({optionalLabel})</span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  ref?: React.Ref<HTMLInputElement>;
  invalid?: boolean;
  /** Icon or text shown inside the input on the left. */
  leading?: React.ReactNode;
};

export function Input({ className, invalid, leading, ...props }: InputProps) {
  if (leading) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
          {leading}
        </span>
        <input aria-invalid={invalid || undefined} className={cn(controlBase, "h-11 pl-10", className)} {...props} />
      </div>
    );
  }
  return <input aria-invalid={invalid || undefined} className={cn(controlBase, "h-11", className)} {...props} />;
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: React.Ref<HTMLTextAreaElement>;
  invalid?: boolean;
};

export function Textarea({ className, invalid, rows = 5, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, "resize-y py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  ref?: React.Ref<HTMLSelectElement>;
  invalid?: boolean;
};

export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(controlBase, "h-11 cursor-pointer appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  ref?: React.Ref<HTMLInputElement>;
  label: React.ReactNode;
};

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm", className)}>
      <input
        id={id}
        type="checkbox"
        className="size-5 cursor-pointer rounded-md border-border accent-accent-500"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
