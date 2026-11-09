/**
 * "Add all to my Amazon cart": Amazon's Add to Cart form link. Every item must
 * come from the same store, so this only works for the US and India stores and
 * only when every saved item has an ASIN for that store.
 */
import { ASIN_PATTERN } from "@/lib/links";
import type { ShopCountry } from "@/lib/country";

const CART_BASE: Partial<Record<ShopCountry, string>> = {
  US: "https://www.amazon.com/gp/aws/cart/add.html",
  IN: "https://www.amazon.in/gp/aws/cart/add.html",
};

export function buildCartUrl(
  country: ShopCountry,
  items: { asin_us: string | null; asin_in: string | null }[],
  tags: { us_tag: string; in_tag: string },
): string | null {
  const base = CART_BASE[country];
  if (!base || items.length === 0) return null;
  const asins = items.map((i) => (country === "IN" ? i.asin_in : i.asin_us)?.trim() ?? "");
  if (asins.some((a) => !ASIN_PATTERN.test(a))) return null;

  const params = new URLSearchParams();
  const tag = (country === "IN" ? tags.in_tag : tags.us_tag).trim();
  if (tag) params.set("AssociateTag", tag);
  asins.forEach((asin, i) => {
    params.set(`ASIN.${i + 1}`, asin);
    params.set(`Quantity.${i + 1}`, "1");
  });
  return `${base}?${params.toString()}`;
}
