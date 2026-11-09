import { describe, expect, it } from "vitest";
import { buildTermFilters, parseSearchTerms, parseSort } from "./search";
import { extractReelCode, isValidHttpUrl } from "./links";

describe("parseSearchTerms", () => {
  it.each(["371", "ep 371", "#371", "ep371", "Ep. 371", "episode 371", "  #371  "])(
    "%s matches episode 371",
    (q) => {
      expect(parseSearchTerms(q)).toEqual(["371"]);
    },
  );

  it("keeps every word so all of them must match", () => {
    expect(parseSearchTerms("Anker charger 371")).toEqual(["anker", "charger", "371"]);
  });

  it("returns no terms for an empty search", () => {
    expect(parseSearchTerms("   ")).toEqual([]);
  });

  it("strips characters that would break the filter", () => {
    expect(parseSearchTerms("a,b (c)")).toEqual(["ab", "c"]);
  });
});

describe("buildTermFilters", () => {
  it("numeric words also match the episode number", () => {
    expect(buildTermFilters(["371"])).toEqual([
      "name.ilike.*371*,brand.ilike.*371*,main_category.ilike.*371*,category.ilike.*371*,episode.eq.371",
    ]);
  });

  it("words also match the main category and subcategory", () => {
    const [filter] = buildTermFilters(["kitchen"]);
    expect(filter).toContain("main_category.ilike.*kitchen*");
    expect(filter).toContain("category.ilike.*kitchen*");
    expect(filter).not.toContain("episode.eq");
  });

  it.each(["21", "ep 21", "#21"])("%s matches episode 21", (q) => {
    expect(buildTermFilters(parseSearchTerms(q))).toEqual([
      expect.stringContaining("episode.eq.21"),
    ]);
  });

  it("produces one AND-ed filter per word", () => {
    expect(buildTermFilters(["anker", "371"])).toHaveLength(2);
  });
});

describe("parseSort", () => {
  it("defaults to newest first", () => {
    expect(parseSort(undefined)).toBe("newest");
    expect(parseSort("oldest")).toBe("oldest");
  });
});

describe("extractReelCode", () => {
  it("saves only the code from a pasted reel URL", () => {
    expect(extractReelCode("https://www.instagram.com/reel/C8xYz12AbCd/?igsh=abc")).toBe(
      "C8xYz12AbCd",
    );
    expect(extractReelCode("instagram.com/reels/DA1b2C3d4E5")).toBe("DA1b2C3d4E5");
    expect(extractReelCode("https://www.instagram.com/someuser/reel/DA1b2C3d4E5/")).toBe(
      "DA1b2C3d4E5",
    );
  });

  it("rejects non-reel and non-Instagram URLs", () => {
    expect(extractReelCode("https://www.instagram.com/p/C8xYz12AbCd/")).toBeNull();
    expect(extractReelCode("https://evil.com/reel/C8xYz12AbCd/")).toBeNull();
    expect(extractReelCode("not a url")).toBeNull();
  });
});

describe("isValidHttpUrl", () => {
  it("accepts Amazon links and rejects junk", () => {
    expect(isValidHttpUrl("https://amzn.to/3abcXYZ")).toBe(true);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("amazon")).toBe(false);
  });
});
