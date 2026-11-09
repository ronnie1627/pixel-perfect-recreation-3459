/** Categories, banners and site settings: public reads through RLS. */
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;
export type Banner = Tables<"banners">;

export const UNCATEGORISED = "Uncategorised";
export const DEFAULT_EMOJI = "🛍️";

export type MainCategory = { main: Category; subs: Category[] };

function byOrder(a: Category, b: Category) {
  return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
}

/**
 * Group flat category rows into main categories with their subcategories.
 * A row whose name is "" is the main category itself.
 */
export function groupCategories(rows: Category[]): MainCategory[] {
  const mains = rows
    .filter((r) => r.name === "")
    .sort((a, b) => a.sort_order - b.sort_order || a.main_category.localeCompare(b.main_category));
  return mains.map((main) => ({
    main,
    subs: rows.filter((r) => r.name !== "" && r.main_category === main.main_category).sort(byOrder),
  }));
}

/** Display label for a product's category, e.g. "Tech & Gadgets · Chargers & cables". */
export function categoryLabel(p: { main_category: string; category: string }): string {
  if (!p.main_category || p.main_category === UNCATEGORISED) return "";
  return p.category ? `${p.main_category} · ${p.category}` : p.main_category;
}

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  staleTime: 5 * 60_000,
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) throw error;
    return data ?? [];
  },
});

export const publicBannersQuery = queryOptions({
  queryKey: ["banners", "public"],
  staleTime: 5 * 60_000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .order("created_at");
    if (error) throw error;
    return data ?? [];
  },
});

export type SettingKey = "us_tag" | "in_tag" | "announcement_text" | "instagram_url";
export type Settings = Record<SettingKey, string>;

export const DEFAULT_SETTINGS: Settings = {
  us_tag: "",
  in_tag: "",
  announcement_text: "New product tested every day · Shop on Amazon in your country",
  instagram_url: "",
};

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  staleTime: 5 * 60_000,
  queryFn: async (): Promise<Settings> => {
    const { data, error } = await supabase.from("settings").select("key, value");
    if (error) throw error;
    const out = { ...DEFAULT_SETTINGS };
    for (const row of data ?? []) {
      if (row.key in out) out[row.key as SettingKey] = row.value;
    }
    return out;
  },
});
