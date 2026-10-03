/** Small building blocks shared by admin pages (server-safe). */
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/components/ui/misc";

export const STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: "warning",
  ACTIVE: "success",
  REJECTED: "danger",
  SOLD: "neutral",
  EXPIRED: "neutral",
};

export function AdminHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Pill-style tabs rendered as links (state lives in the URL). */
export function FilterTabs({ tabs, active }: { tabs: { key: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={active === tab.key ? "page" : undefined}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
            active === tab.key
              ? "bg-brand-900 text-white dark:bg-brand-600"
              : "border border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn("rounded-full px-1.5 text-xs", active === tab.key ? "bg-white/20" : "bg-muted")}>{tab.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/** GET search box (keeps other params via hidden inputs). */
export function SearchBox({ placeholder, defaultValue, hidden }: { placeholder: string; defaultValue?: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form className="w-full sm:w-72" role="search">
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
      />
    </form>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}

export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm [&_tbody_tr]:border-t [&_tbody_tr]:border-border [&_tbody_tr:hover]:bg-muted/40">
          {children}
        </table>
      </div>
    </div>
  );
}

export function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center text-muted-foreground">
        {text}
      </td>
    </tr>
  );
}

export const ADMIN_PAGE_SIZE = 20;
