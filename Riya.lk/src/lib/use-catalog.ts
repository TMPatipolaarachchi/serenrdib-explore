"use client";

import { useEffect, useState } from "react";

export interface CatalogOption {
  id: string;
  slug: string;
  name: string;
}

// Simple in-memory cache so switching back and forth doesn't refetch.
const cache = new Map<string, Promise<CatalogOption[]>>();

function load(url: string) {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => {
        cache.delete(url);
        return [];
      });
    cache.set(url, p);
  }
  return p;
}

/**
 * Fetches a brands/models list from the catalogue API.
 * Returns `undefined` while loading (or when `url` is null).
 */
export function useCatalog(url: string | null): CatalogOption[] | undefined {
  const [state, setState] = useState<{ url: string | null; data?: CatalogOption[] }>({ url: null });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    load(url).then((data) => {
      if (!cancelled) setState({ url, data });
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return url && state.url === url ? state.data : undefined;
}
