/**
 * Search helpers shared by the public feed and the admin dashboard.
 * Pure functions — no network — so they are unit tested.
 */

const MAX_TERMS = 8;

/**
 * Turn a raw query into search terms. Every term must match (AND).
 * "371", "ep 371", "ep371", "ep. 371", "episode 371" and "#371" all become ["371"].
 */
export function parseSearchTerms(raw: string): string[] {
  let s = raw.toLowerCase().normalize("NFKC");
  s = s.replace(/#/g, " ");
  // Drop an "ep"/"ep."/"episode" prefix when it is followed by a number.
  s = s.replace(/\b(?:episode|ep)\.?\s*(?=\d)/g, " ");
  return s
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}\-'&+.]/gu, "").replace(/^\.+|\.+$/g, ""))
    .filter(Boolean)
    .slice(0, MAX_TERMS);
}

/** True when a term should also be compared against the episode number. */
export function isEpisodeTerm(term: string): boolean {
  return /^\d{1,9}$/.test(term);
}

/**
 * One PostgREST `or` filter per term. Multiple `.or()` calls are ANDed together,
 * so every term must match the episode, name, brand or category.
 */
export function buildTermFilters(terms: string[]): string[] {
  return terms.map((term) => {
    const parts = [
      `name.ilike.*${term}*`,
      `brand.ilike.*${term}*`,
      `main_category.ilike.*${term}*`,
      `category.ilike.*${term}*`,
    ];
    if (isEpisodeTerm(term)) parts.push(`episode.eq.${Number(term)}`);
    return parts.join(",");
  });
}

export type SortOrder = "newest" | "oldest";

export function parseSort(value: unknown): SortOrder {
  return value === "oldest" ? "oldest" : "newest";
}
