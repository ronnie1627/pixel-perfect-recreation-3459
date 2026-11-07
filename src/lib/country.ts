/**
 * "Shop from" country: decides which Amazon store a product button opens.
 * Pure helpers are unit tested; the store keeps the choice in memory only
 * (no cookies, no storage, no tracking).
 */
import { useSyncExternalStore } from "react";

export type ShopCountry = "US" | "IN";

export const COUNTRY_LABELS: Record<ShopCountry, string> = {
  US: "United States",
  IN: "India",
};

/** en-IN selects India; every other browser language selects the United States. */
export function countryFromLanguage(lang: string | undefined | null): ShopCountry {
  return (lang ?? "").trim().toLowerCase() === "en-in" ? "IN" : "US";
}

/** The link the button opens: India link when India is selected and one exists, else the US link. */
export function pickAmazonLink(
  product: { amazon_url: string; amazon_url_in: string | null },
  country: ShopCountry,
): { url: string; store: "Amazon.in" | "Amazon.com" } {
  const india = product.amazon_url_in?.trim();
  if (country === "IN" && india) return { url: india, store: "Amazon.in" };
  return { url: product.amazon_url, store: "Amazon.com" };
}

// ---- In-memory store shared by every page during a visit ----

let chosen: ShopCountry | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): ShopCountry {
  if (chosen === null) {
    const lang = typeof navigator !== "undefined" ? (navigator.languages?.[0] ?? navigator.language) : "";
    chosen = countryFromLanguage(lang);
  }
  return chosen;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setShopCountry(country: ShopCountry) {
  chosen = country;
  listeners.forEach((l) => l());
}

export function useShopCountry(): ShopCountry {
  return useSyncExternalStore(subscribe, getSnapshot, () => "US");
}
