import { describe, expect, it } from "vitest";
import { buildCartUrl } from "./cart";
import { countryParam, parseCountryParam } from "./country";
import { extractAsin, isInternalPath, isMissingAffiliateTag } from "./links";
import { parseEpisodeList, shareListPath } from "./my-list";
import { categoryLabel, groupCategories, type Category } from "./catalog";

const tags = { us_tag: "vettly-20", in_tag: "vettly-21" };
const both = { asin_us: "B0US000001", asin_in: "B0IN000001" };
const both2 = { asin_us: "B0US000002", asin_in: "B0IN000002" };

describe("Add all to my Amazon cart", () => {
  it("builds the amazon.com cart link with the US tag and one of each item", () => {
    expect(buildCartUrl("US", [both, both2], tags)).toBe(
      "https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=vettly-20&ASIN.1=B0US000001&Quantity.1=1&ASIN.2=B0US000002&Quantity.2=1",
    );
  });

  it("uses amazon.in, the India tag and India ASINs when shopping from India", () => {
    expect(buildCartUrl("IN", [both], tags)).toBe(
      "https://www.amazon.in/gp/aws/cart/add.html?AssociateTag=vettly-21&ASIN.1=B0IN000001&Quantity.1=1",
    );
  });

  it.each(["GB", "DE", "OTHER"] as const)("is unavailable when shopping from %s", (c) => {
    expect(buildCartUrl(c, [both], tags)).toBeNull();
  });

  it("is unavailable when any saved item lacks an ASIN for that store", () => {
    expect(buildCartUrl("US", [both, { asin_us: null, asin_in: "B0IN000003" }], tags)).toBeNull();
    expect(buildCartUrl("IN", [both, { asin_us: "B0US000003", asin_in: null }], tags)).toBeNull();
  });

  it("is unavailable for an empty list", () => {
    expect(buildCartUrl("US", [], tags)).toBeNull();
  });
});

describe("extractAsin", () => {
  it("reads /dp/ASIN and /gp/product/ASIN links", () => {
    expect(extractAsin("https://www.amazon.com/Anker-Charger/dp/B0C1234567/ref=x?tag=a-20")).toBe("B0C1234567");
    expect(extractAsin("https://www.amazon.in/gp/product/b0c7654321?th=1")).toBe("B0C7654321");
  });

  it("returns null for short links", () => {
    expect(extractAsin("https://amzn.to/3abcDEF")).toBeNull();
    expect(extractAsin("https://link.amazon/B0e4czSKl")).toBeNull();
  });
});

describe("affiliate tag warning", () => {
  it("warns for a full store link without tag=", () => {
    expect(isMissingAffiliateTag("https://www.amazon.com/dp/B0C1234567")).toBe(true);
    expect(isMissingAffiliateTag("https://www.amazon.com/dp/B0C1234567?tag=vettly-20")).toBe(false);
  });

  it("does not warn for short links, which carry the tag after redirecting", () => {
    expect(isMissingAffiliateTag("https://amzn.to/3abc")).toBe(false);
    expect(isMissingAffiliateTag("https://link.amazon/B0e4czSKl")).toBe(false);
  });
});

describe("banner links stay on the site", () => {
  it.each(["/browse?main=Tech", "/ep/21", "/"])("accepts %s", (v) => {
    expect(isInternalPath(v)).toBe(true);
  });
  it.each(["https://evil.com", "//evil.com", "browse", "/\\evil.com"])("rejects %s", (v) => {
    expect(isInternalPath(v)).toBe(false);
  });
});

describe("?country= in the URL", () => {
  it("reads codes in any case and rejects unknown ones", () => {
    expect(parseCountryParam("in")).toBe("IN");
    expect(parseCountryParam("GB")).toBe("GB");
    expect(parseCountryParam("other")).toBe("OTHER");
    expect(parseCountryParam("xx")).toBeNull();
    expect(parseCountryParam(undefined)).toBeNull();
  });
  it("writes lowercase codes", () => {
    expect(countryParam("IN")).toBe("in");
  });
});

describe("My list", () => {
  it("parses a shared ?items=21,24,28 list in order without duplicates", () => {
    expect(parseEpisodeList("21,24,28,24, x ,-3")).toEqual([21, 24, 28]);
    expect(parseEpisodeList([5, "6", 5])).toEqual([5, 6]);
    expect(parseEpisodeList(undefined)).toEqual([]);
  });
  it("builds the share link", () => {
    expect(shareListPath([21, 24, 28])).toBe("/list?items=21,24,28");
  });
});

describe("categories", () => {
  const row = (main_category: string, name: string, sort_order: number): Category => ({
    id: `${main_category}/${name}`,
    main_category,
    name,
    sort_order,
    emoji: "",
    image_url: null,
    show_on_home: name === "",
    created_at: "",
  });

  it("groups subcategories under their main category in sort order", () => {
    const grouped = groupCategories([
      row("Tech & Gadgets", "Smart home", 3),
      row("Home & Kitchen", "", 10),
      row("Tech & Gadgets", "", 20),
      row("Tech & Gadgets", "Earbuds & audio", 1),
    ]);
    expect(grouped.map((g) => g.main.main_category)).toEqual(["Home & Kitchen", "Tech & Gadgets"]);
    expect(grouped[1]?.subs.map((s) => s.name)).toEqual(["Earbuds & audio", "Smart home"]);
  });

  it("hides the Uncategorised label", () => {
    expect(categoryLabel({ main_category: "Uncategorised", category: "" })).toBe("");
    expect(categoryLabel({ main_category: "Tools & DIY", category: "Repair" })).toBe("Tools & DIY · Repair");
  });
});
