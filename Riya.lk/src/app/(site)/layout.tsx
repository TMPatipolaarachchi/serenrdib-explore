import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { countUnreadMessages } from "@/lib/chat";

/** Layout for the public site: header, footer and phone bottom navigation. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSiteSettings()]);
  const unread = user ? await countUnreadMessages(user.id) : 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        user={user ? { id: user.id, name: user.name, email: user.email, image: user.image } : null}
        logoUrl={settings.logoUrl}
        initialUnread={unread}
      />
      <main className="flex-1">{children}</main>
      <div className="pb-safe-nav">
        <Footer />
      </div>
    </div>
  );
}
