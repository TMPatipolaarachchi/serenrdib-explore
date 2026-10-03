import { LogoMark } from "@/components/logo";

/** Centered card used by the admin login and change-password pages. */
export function AdminAuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-brand-950 p-4">
      <div aria-hidden className="absolute -top-40 -right-40 size-[32rem] rounded-full bg-brand-600/30 blur-3xl" />
      <div aria-hidden className="absolute -bottom-40 -left-40 size-[28rem] rounded-full bg-accent-500/15 blur-3xl" />
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-2xl sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <LogoMark className="size-11" />
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
