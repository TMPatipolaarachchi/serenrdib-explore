"use client";

/** Admin panel frame: sidebar on desktop, drawer on phones, top bar with logout. */
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Flag,
  FolderTree,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  Tags,
  Users,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Modal } from "@/components/ui/modal";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { adminFetch } from "./admin-client";
import { cn } from "@/lib/utils";

interface Counts {
  pendingAds: number;
  openReports: number;
}

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/ads", label: "Ads", icon: ListChecks, badge: "pendingAds" as const },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: Flag, badge: "openReports" as const },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/brands", label: "Brands & models", icon: Tags },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
];

function NavLinks({ counts, onNavigate }: { counts: Counts; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {NAV.map(({ href, label, icon: Icon, exact, badge }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        const count = badge ? counts[badge] : 0;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-white/12 text-white" : "text-brand-100/75 hover:bg-white/8 hover:text-white",
            )}
          >
            <Icon className="size-[18px]" />
            <span className="flex-1">{label}</span>
            {count > 0 && (
              <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-bold text-white">{count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ username, counts, children }: { username: string; counts: Counts; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function logout() {
    await adminFetch("/api/admin/auth/logout", "POST");
    router.replace("/admin/login");
    router.refresh();
  }

  const brand = (
    <div className="flex items-center gap-2.5 px-2">
      <LogoMark className="size-9" />
      <div>
        <p className="leading-none font-extrabold text-white">
          Riya<span className="text-accent-400">.lk</span>
        </p>
        <p className="mt-1 text-[11px] font-medium tracking-wider text-brand-200/70 uppercase">Admin</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 bg-brand-950 p-4 lg:flex">
        {brand}
        <NavLinks counts={counts} />
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          <Link href="/admin/change-password" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-brand-100/75 hover:bg-white/8 hover:text-white">
            <KeyRound className="size-[18px]" /> Change password
          </Link>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-brand-100/75 hover:bg-white/8 hover:text-white">
            <LogOut className="size-[18px]" /> Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/85 px-4 backdrop-blur-xl sm:px-6">
          <button type="button" onClick={() => setOpen(true)} className="rounded-xl p-2 hover:bg-muted lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-semibold text-foreground">{username}</span>
          </p>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <button type="button" onClick={logout} className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-muted sm:flex lg:hidden">
              <LogOut className="size-4" /> Log out
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile drawer */}
      <Modal open={open} onClose={() => setOpen(false)} side="left" title={<span className="sr-only">Menu</span>}>
        <div className="-mx-5 -my-4 flex min-h-full flex-col gap-6 bg-brand-950 p-4">
          {brand}
          <NavLinks counts={counts} onNavigate={() => setOpen(false)} />
          <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
            <Link href="/admin/change-password" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-brand-100/75">
              <KeyRound className="size-[18px]" /> Change password
            </Link>
            <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-brand-100/75">
              <LogOut className="size-[18px]" /> Log out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
