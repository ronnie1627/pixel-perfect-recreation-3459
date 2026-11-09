import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { buildTermFilters, parseSearchTerms, type SortOrder } from "@/lib/search";

export type Product = Tables<"products">;

export const PUBLIC_PAGE_SIZE = 10;
/** Reels load 6 at a time, photo tiles 12 at a time. */
export const REEL_PAGE_SIZE = 6;
export const PHOTO_PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 25;

export type ProductPage = { rows: Product[]; count: number; nextOffset: number | null };

export type StatusFilter = "all" | "published" | "hidden";

/**
 * Fetch one page of products. RLS decides visibility: visitors only ever
 * receive published rows; the admin receives everything. Public pages also
 * pass status "published" so a signed-in admin sees what visitors see.
 */
export async function fetchProductPage(opts: {
  query: string;
  sort: SortOrder;
  offset: number;
  pageSize: number;
  status?: StatusFilter;
  main?: string | undefined;
  cat?: string | undefined;
}): Promise<ProductPage> {
  const { query, sort, offset, pageSize, status = "all", main, cat } = opts;
  let req = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: sort === "oldest" })
    .order("id", { ascending: sort === "oldest" })
    .range(offset, offset + pageSize - 1);

  for (const filter of buildTermFilters(parseSearchTerms(query))) {
    req = req.or(filter);
  }
  if (status === "published") req = req.eq("published", true);
  if (status === "hidden") req = req.eq("published", false);
  if (main) req = req.eq("main_category", main);
  if (main && cat) req = req.eq("category", cat);

  const { data, error, count } = await req;
  if (error) throw error;
  const rows = data ?? [];
  const total = count ?? rows.length;
  const next = offset + rows.length;
  return { rows, count: total, nextOffset: rows.length === pageSize && next < total ? next : null };
}

/** Published products for a list of episode numbers (My list / shared lists). */
export async function fetchProductsByEpisodes(episodes: number[]): Promise<Product[]> {
  if (episodes.length === 0) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .in("episode", episodes);
  if (error) throw error;
  const byEpisode = new Map((data ?? []).map((p) => [p.episode, p]));
  return episodes.flatMap((e) => byEpisode.get(e) ?? []);
}
