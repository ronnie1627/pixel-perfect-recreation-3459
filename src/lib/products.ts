import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { buildTermFilters, parseSearchTerms, type SortOrder } from "@/lib/search";

export type Product = Tables<"products">;

export const PUBLIC_PAGE_SIZE = 10;
export const ADMIN_PAGE_SIZE = 25;

export type ProductPage = { rows: Product[]; count: number; nextOffset: number | null };

export type StatusFilter = "all" | "published" | "hidden";

/**
 * Fetch one page of products. RLS decides visibility: visitors only ever
 * receive published rows; the admin receives everything.
 */
export async function fetchProductPage(opts: {
  query: string;
  sort: SortOrder;
  offset: number;
  pageSize: number;
  status?: StatusFilter;
}): Promise<ProductPage> {
  const { query, sort, offset, pageSize, status = "all" } = opts;
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

  const { data, error, count } = await req;
  if (error) throw error;
  const rows = data ?? [];
  const total = count ?? rows.length;
  const next = offset + rows.length;
  return { rows, count: total, nextOffset: rows.length === pageSize && next < total ? next : null };
}
