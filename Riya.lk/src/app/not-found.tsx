import Link from "next/link";

/** Fallback 404 for URLs outside the public site layout. */
export default function RootNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-extrabold text-brand-900 dark:text-white">404</p>
      <p className="text-muted-foreground">This page could not be found.</p>
      <Link href="/" className="font-semibold text-accent-600 hover:underline">
        Go to homepage
      </Link>
    </main>
  );
}
