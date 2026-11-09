/**
 * "Shop from" country: decides which Amazon store a product button opens.
 * Pure helpers are unit tested; the choice is kept in the URL as ?country=
 * (no cookies, no storage, no tracking).
 */
import { useSyncExternalStore } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

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
  const regionCode = region?.toUpperCase();
  if (regionCode && REGION_COUNTRIES[regionCode]) return REGION_COUNTRIES[regionCode];
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
  // India with no India link opens the US link, so the note must say Amazon.com.
  const store = country === "IN" ? STORE_NAMES.US : STORE_NAMES[country];
  return { url: product.amazon_url, store };
}

// ---- The choice lives in the URL (?country=in) — no cookies, no storage ----

/** Read ?country= ("in", "gb", "other"…); null when missing or unknown. */
export function parseCountryParam(value: unknown): ShopCountry | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return code in COUNTRY_LABELS ? (code as ShopCountry) : null;
}

export function countryParam(country: ShopCountry): string {
  return country.toLowerCase();
}

let languageDefault: ShopCountry | null = null;

function getLanguageDefault(): ShopCountry {
  if (languageDefault === null) {
    const lang = typeof navigator !== "undefined" ? (navigator.languages?.[0] ?? navigator.language) : "";
    languageDefault = countryFromLanguage(lang);
  }
  return languageDefault;
}

const noopSubscribe = () => () => {};

/** The selected country: ?country= when set, otherwise the browser language default. */
export function useShopCountry(): ShopCountry {
  const param = useRouterState({
    select: (s) => (s.location.search as Record<string, unknown>)["country"],
  });
  const fallback = useSyncExternalStore(noopSubscribe, getLanguageDefault, () => "US" as const);
  return parseCountryParam(param) ?? fallback;
}

/** Change the country by rewriting ?country= on the current page. */
export function useSetShopCountry() {
  const navigate = useNavigate();
  return (country: ShopCountry) =>
    void navigate({
      to: ".",
      search: ((prev: Record<string, unknown>) => ({ ...prev, country: countryParam(country) })) as never,
      replace: true,
      resetScroll: false,
    });
}
