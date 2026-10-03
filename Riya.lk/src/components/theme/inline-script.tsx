/**
 * Inline <script> that runs during the initial HTML parse, without triggering
 * React's "Encountered a script tag" warning on the client.
 *
 * The server renders it as `text/javascript`, so the browser executes it before
 * first paint. On the client the type becomes `text/plain` (a data block React
 * doesn't warn about); `suppressHydrationWarning` covers the attribute mismatch.
 * Must be rendered from a Client Component so the client-side type applies.
 * Pattern from the Next.js guide "How to prevent flash before hydration".
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
