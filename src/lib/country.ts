/**
 * "Shop from" country: decides which Amazon store a product button opens.
 * Pure helpers are unit tested; the store keeps the choice in memory only
 * (no cookies, no storage, no tracking).
 */
import { useSyncExternalStore } from "react";

export type ShopCountry =
  | "US"
  | "IN"
  | "GB"
  | "CA"
  | "DE"
  | "FR"
  | "IT"
  | "ES"
  | "NL"
  | "PL"
  | "SE"
  | "OTHER";

/** Dropdown order, exactly as listed by the site owner. */
export const COUNTRY_LABELS: Record<ShopCountry, string> = {
  US: "United States",
  IN: "India",
  GB: "United Kingdom",
  CA: "Canada",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  PL: "Poland",
  SE: "Sweden",
  OTHER: "Other countries",
};

/** The store named in the note under the button: "Opens <store>". */
export const STORE_NAMES: Record<ShopCountry, string> = {
  US: "Amazon.com",
  IN: "Amazon.in",
  GB: "Amazon.co.uk",
  CA: "Amazon.ca",
  DE: "Amazon.de",
  FR: "Amazon.fr",
  IT: "Amazon.it",
  ES: "Amazon.es",
  NL: "Amazon.nl",
  PL: "Amazon.pl",
  SE: "Amazon.se",
  OTHER: "your local Amazon store",
};

// Region subtag wins (en-IN -> India, en-GB -> United Kingdom), then the
// language subtag (fr -> France, de -> Germany). Anything else falls back to US.
const REGION_COUNTRIES: Record<string, ShopCountry> = {
  US: "US",
  IN: "IN",
  GB: "GB",
  UK: "GB",
  CA: "CA",
  DE: "DE",
  FR: "FR",
  IT: "IT",
  ES: "ES",
  NL: "NL",
  PL: "PL",
  SE: "SE",
};

const LANGUAGE_COUNTRIES: Record<string, ShopCountry> = {
  fr: "FR",
  de: "DE",
  it: "IT",
  es: "ES",
  nl: "NL",
  pl: "PL",
  sv: "SE",
};

/** Pick the country from a browser language tag such as "en-IN", "fr" or "de-AT". */
export function countryFromLanguage(lang: string | undefined | null): ShopCountry {
  const [language, region] = (lang ?? "").trim().toLowerCase().split(/[-_]/);
  if (region && REGION_COUNTRIES[region]) return REGION_COUNTRIES[region];
  if (language && LANGUAGE_COUNTRIES[language]) return LANGUAGE_COUNTRIES[language];
  return "US";
}

/**
 * The link the button opens: the India link when India is selected and one exists,
 * otherwise the US link (Amazon redirects visitors to their own local store).
 */
export function pickAmazonLink(
  product: { amazon_url: string; amazon_url_in: string | null },
  country: ShopCountry,
): { url: string; store: string } {
  const india = product.amazon_url_in?.trim();
  if (country === "IN" && india) return { url: india, store: STORE_NAMES.IN };
  return { url: product.amazon_url, store: STORE_NAMES[country] };
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
