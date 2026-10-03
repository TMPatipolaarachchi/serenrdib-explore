import type { Metadata } from "next";

/** Root of the admin area — never indexed, never linked from the public site. */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Riya.lk Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
