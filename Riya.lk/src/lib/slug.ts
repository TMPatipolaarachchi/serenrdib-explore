/**
 * Slug helpers. Kept dependency-free so the seed script can import them too.
 */

/** "Toyota Aqua G 2015!" → "toyota-aqua-g-2015" */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/** Short random id used to keep ad slugs unique (e.g. "k3j9x2"). */
export function shortId(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/**
 * Builds a unique, SEO-friendly ad slug from its title.
 * Sinhala/Tamil-only titles produce an empty base, so we fall back to "ad".
 */
export function adSlug(title: string): string {
  const base = slugify(title).slice(0, 60) || "ad";
  return `${base}-${shortId()}`;
}
