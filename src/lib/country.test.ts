import { describe, expect, it } from "vitest";
import {
  COUNTRY_LABELS,
  STORE_NAMES,
  countryFromLanguage,
  pickAmazonLink,
  type ShopCountry,
} from "./country";
import { isAmazonUrl } from "./links";

describe("countryFromLanguage", () => {
  it("en-IN selects India", () => {
    expect(countryFromLanguage("en-IN")).toBe("IN");
    expect(countryFromLanguage("en-in")).toBe("IN");
    expect(countryFromLanguage("hi-IN")).toBe("IN");
  });

  it.each([
    ["en-GB", "GB"],
    ["en-CA", "CA"],
    ["de", "DE"],
    ["de-AT", "DE"],
    ["fr", "FR"],
    ["fr-FR", "FR"],
    ["it", "IT"],
    ["es", "ES"],
    ["nl", "NL"],
    ["pl", "PL"],
    ["sv", "SE"],
    ["sv-SE", "SE"],
  ])("%s selects %s", (lang, country) => {
    expect(countryFromLanguage(lang)).toBe(country);
  });

  it.each(["en-US", "en", "ja", "en-PH", "", undefined, null])("%s selects the United States", (lang) => {
    expect(countryFromLanguage(lang)).toBe("US");
  });
});

describe("pickAmazonLink", () => {
  const both = { amazon_url: "https://amzn.to/us", amazon_url_in: "https://www.amazon.in/dp/X" };
  const usOnly = { amazon_url: "https://amzn.to/us", amazon_url_in: null };

  it("India selected with an India link opens Amazon.in", () => {
    expect(pickAmazonLink(both, "IN")).toEqual({ url: "https://www.amazon.in/dp/X", store: "Amazon.in" });
  });

  it("India selected without an India link falls back to the US link", () => {
    expect(pickAmazonLink(usOnly, "IN")).toEqual({ url: "https://amzn.to/us", store: "Amazon.com" });
    expect(pickAmazonLink({ ...usOnly, amazon_url_in: "  " }, "IN").store).toBe("Amazon.com");
  });

  it("United States selected always opens the US link", () => {
    expect(pickAmazonLink(both, "US")).toEqual({ url: "https://amzn.to/us", store: "Amazon.com" });
  });

  it.each([
    ["GB", "Amazon.co.uk"],
    ["CA", "Amazon.ca"],
    ["DE", "Amazon.de"],
    ["FR", "Amazon.fr"],
    ["IT", "Amazon.it"],
    ["ES", "Amazon.es"],
    ["NL", "Amazon.nl"],
    ["PL", "Amazon.pl"],
    ["SE", "Amazon.se"],
    ["OTHER", "your local Amazon store"],
  ] as [ShopCountry, string][])(
    "%s selected opens the US link but says %s",
    (country, store) => {
      expect(pickAmazonLink(both, country)).toEqual({ url: "https://amzn.to/us", store });
      expect(pickAmazonLink(usOnly, country)).toEqual({ url: "https://amzn.to/us", store });
    },
  );

  it("only India changes the link that opens", () => {
    for (const country of Object.keys(COUNTRY_LABELS) as ShopCountry[]) {
      expect(pickAmazonLink(both, country).url).toBe(
        country === "IN" ? "https://www.amazon.in/dp/X" : "https://amzn.to/us",
      );
    }
  });
});

describe("store notes", () => {
  it("every country has a note name", () => {
    for (const country of Object.keys(COUNTRY_LABELS) as ShopCountry[]) {
      expect(STORE_NAMES[country]?.length).toBeGreaterThan(0);
    }
  });

  it("the dropdown lists exactly the agreed countries in order", () => {
    expect(Object.keys(COUNTRY_LABELS)).toEqual([
      "US",
      "IN",
      "GB",
      "CA",
      "DE",
      "FR",
      "IT",
      "ES",
      "NL",
      "PL",
      "SE",
      "OTHER",
    ]);
    expect(Object.values(COUNTRY_LABELS)).toEqual([
      "United States",
      "India",
      "United Kingdom",
      "Canada",
      "Germany",
      "France",
      "Italy",
      "Spain",
      "Netherlands",
      "Poland",
      "Sweden",
      "Other countries",
    ]);
  });
});

describe("isAmazonUrl", () => {
  it.each([
    "https://www.amazon.in/dp/B0ABC",
    "https://amazon.in/dp/B0ABC",
    "https://www.amazon.com/dp/B0ABC",
    "https://amzn.to/3abc",
    "https://amzn.in/d/abc",
    "https://link.amazon/B06vRBrOu",
  ])("accepts %s", (url) => {
    expect(isAmazonUrl(url)).toBe(true);
  });

  it.each(["https://flipkart.com/x", "https://amazon.in.evil.com/x", "https://notamazon.in/x", "amazon.in", "javascript:alert(1)"])(
    "rejects %s",
    (url) => {
      expect(isAmazonUrl(url)).toBe(false);
    },
  );
});
