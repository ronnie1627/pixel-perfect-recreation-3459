import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Product } from "@/lib/products";

/**
 * Public product page data, read with the publishable key so only published
 * products are ever returned (RLS). Returns null for unknown or hidden episodes.
 */
export const getEpisodePage = createServerFn({ method: "GET" })
  .inputValidator((input: { episode: number }) => {
    const episode = Number(input?.episode);
    if (!Number.isInteger(episode) || episode < 0 || episode > 999_999_999) {
      return { episode: -1 };
    }
    return { episode };
  })
  .handler(async ({ data }): Promise<{ product: Product; related: Product[] } | null> => {
    if (data.episode < 0) return null;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const db = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: product, error } = await db
      .from("products")
      .select("*")
      .eq("published", true)
      .eq("episode", data.episode)
      .maybeSingle();
    if (error) {
      console.error("getEpisodePage", error);
      throw new Error("Couldn't load this product.");
    }
    if (!product) return null;

    // "More picks": same subcategory first, then same main category, then newest.
    const related: Product[] = [];
    const seen = new Set([product.id]);
    const add = (rows: Product[] | null) => {
      for (const r of rows ?? []) {
        if (related.length >= 4 || seen.has(r.id)) continue;
        seen.add(r.id);
        related.push(r);
      }
    };
    const base = () =>
      db
        .from("products")
        .select("*")
        .eq("published", true)
        .neq("id", product.id)
        .order("created_at", { ascending: false })
        .limit(8);

    if (product.category) {
      add((await base().eq("main_category", product.main_category).eq("category", product.category)).data);
    }
    if (related.length < 4) add((await base().eq("main_category", product.main_category)).data);
    if (related.length < 4) add((await base()).data);

    return { product, related };
  });
