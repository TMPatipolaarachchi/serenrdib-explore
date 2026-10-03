"use client";

/**
 * Site header (sticky, blurred) + the phone bottom navigation bar.
 * The signed-in user is passed from the server layout, so there is no
 * loading flash and no client-side session fetch.
 */
import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import Form from "next/form";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  House,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { useI18n } from "@/lib/i18n/client";
import { useClickOutside, useInterval } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export interface HeaderUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export function Header({ user, logoUrl, initialUnread }: { user: HeaderUser | null; logoUrl?: string | null; initialUnread: number }) {
  const { t } = useI18n();
  const [unread, setUnread] = useState(initialUnread);

  // Keep the unread-messages badge fresh.
  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations/unread", { cache: "no-store" });
      if (res.ok) setUnread((await res.json()).count);
    } catch {
      /* offline — ignore */
    }
  }, []);
  useInterval(refreshUnread, 30_000, !!user);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/85 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0" aria-label="Riya.lk home">
            <Logo logoUrl={logoUrl} />
          </Link>

          <Suspense fallback={<div className="mx-4 hidden max-w-xl flex-1 md:flex" />}>
            <HeaderSearch className="mx-4 hidden max-w-xl flex-1 md:flex" />
          </Suspense>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <LanguageSwitcher />
            <ThemeToggle />

            {user ? (
              <>
                <IconLink href="/favourites" label={t.nav.favourites} className="hidden lg:flex">
                  <Heart className="size-5" />
                </IconLink>
                <IconLink href="/messages" label={t.nav.messages} badge={unread} className="hidden lg:flex">
                  <MessageCircle className="size-5" />
                </IconLink>
                <UserMenu user={user} />
              </>
            ) : (
              <Link href="/login" className={buttonClass({ variant: "ghost", size: "sm", className: "hidden h-10 sm:inline-flex" })}>
                {t.nav.login}
              </Link>
            )}

            <Link href="/post-ad" className={buttonClass({ size: "md", className: "ml-2 hidden lg:inline-flex" })}>
              <Plus className="size-4" strokeWidth={2.5} />
              {t.nav.postAd}
            </Link>
          </div>
        </div>
      </header>

      <MobileNav user={user} unread={unread} />
    </>
  );
}

/** Compact keyword search in the header (desktop). */
function HeaderSearch({ className }: { className?: string }) {
  const { t } = useI18n();
  const params = useSearchParams();
  return (
    <Form action="/search" className={cn("relative items-center", className)} role="search">
      <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" aria-hidden />
      <input
        name="q"
        defaultValue={params.get("q") ?? ""}
        placeholder={t.home.searchPlaceholder}
        aria-label={t.common.search}
        className="h-10 w-full rounded-xl border border-border bg-muted/60 pr-4 pl-10 text-sm transition placeholder:text-muted-foreground focus:border-brand-500 focus:bg-card focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
      />
    </Form>
  );
}

function IconLink({
  href,
  label,
  badge,
  className,
  children,
}: {
  href: string;
  label: string;
  badge?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cn(
        "relative size-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {children}
      {!!badge && (
        <span className="absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white ring-2 ring-card">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function UserMenu({ user }: { user: HeaderUser }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);

  const links = [
    { href: "/my-ads", label: t.nav.myAds, icon: LayoutGrid },
    { href: "/favourites", label: t.nav.favourites, icon: Heart },
    { href: "/messages", label: t.nav.messages, icon: MessageCircle },
    { href: "/profile", label: t.nav.profile, icon: UserRound },
  ];

  return (
    <div ref={ref} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.nav.account}
      >
        <Avatar name={user.name} src={user.image} size={34} />
        <ChevronDown className={cn("hidden size-4 text-muted-foreground transition sm:block", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl"
          >
            <div className="px-3 py-2.5">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-border" />
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-muted"
              >
                <Icon className="size-4 text-muted-foreground" />
                {label}
              </Link>
            ))}
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <LogOut className="size-4" />
              {t.nav.logout}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Fixed bottom navigation for phones — the most used actions within thumb reach. */
function MobileNav({ user, unread }: { user: HeaderUser | null; unread: number }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const items = [
    { href: "/", label: t.nav.home, icon: House },
    { href: "/search", label: t.nav.search, icon: Search },
    { href: "/post-ad", label: t.nav.postAd, icon: Plus, primary: true },
    { href: "/messages", label: t.nav.chats, icon: MessageCircle, badge: unread },
    { href: user ? "/profile" : "/login", label: user ? t.nav.account : t.nav.login, icon: UserRound },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label={t.nav.menu}
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
        {items.map(({ href, label, icon: Icon, primary, badge }) => (
          <li key={label} className="flex min-w-0">
            <Link
              href={href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                isActive(href) && !primary ? "text-brand-700 dark:text-brand-300" : "text-muted-foreground",
              )}
            >
              {primary ? (
                <span className="-mt-7 flex size-13 items-center justify-center rounded-2xl bg-accent-500 text-white shadow-lg shadow-accent-500/40 ring-4 ring-card transition active:scale-95">
                  <Icon className="size-6" strokeWidth={2.5} />
                </span>
              ) : (
                <span className="relative">
                  <Icon className="size-[22px]" strokeWidth={isActive(href) ? 2.4 : 2} />
                  {!!badge && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-bold text-white">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
              )}
              <span className="max-w-full truncate px-1">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
