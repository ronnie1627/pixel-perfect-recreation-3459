import { describe, expect, it } from "vitest";
import { countryFromLanguage, pickAmazonLink } from "./country";
import { isAmazonUrl } from "./links";

describe("countryFromLanguage", () => {
  it("en-IN selects India", () => {
    expect(countryFromLanguage("en-IN")).toBe("IN");
    expect(countryFromLanguage("en-in")).toBe("IN");
  });

  it.each(["en-US", "en-GB", "hi-IN", "en", "", undefined])("%s selects the United States", (lang) => {
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
