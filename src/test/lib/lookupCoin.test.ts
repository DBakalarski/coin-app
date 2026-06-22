import { describe, it, expect } from "vitest";
import { buildSearchQuery, parseNumistaCoin, lookupCoin } from "@/lib/numista/lookupCoin";

const identity = {
  country: "Polska", year: 1923, denomination: "5 groszy",
  name: "5 groszy", material: null, mintMark: null, confidence: "high" as const,
};

describe("buildSearchQuery", () => {
  it("combines name, denomination, country and year", () => {
    expect(buildSearchQuery(identity)).toBe("5 groszy Polska 1923");
  });
});

describe("parseNumistaCoin", () => {
  it("maps normalized detail into NumistaResult", () => {
    const r = parseNumistaCoin({
      id: "123", url: "https://en.numista.com/catalogue/pieces123.html",
      currency: "PLN", prices: { VF: 15, UNC: 120 }, mintage: 40000, rarity_index: null,
    });
    expect(r?.numistaId).toBe("123");
    expect(r?.priceTable?.grades.VF).toBe(15);
    expect(r?.mintage).toBe(40000);
  });
  it("returns null priceTable when no prices", () => {
    const r = parseNumistaCoin({ id: "9", url: "u", currency: "PLN", prices: {}, mintage: null, rarity_index: null });
    expect(r?.priceTable).toBeNull();
  });
});

describe("lookupCoin", () => {
  it("returns null when search finds nothing", async () => {
    const fetcher = { search: async () => null, detail: async () => null };
    expect(await lookupCoin(fetcher, identity)).toBeNull();
  });
  it("returns parsed result on hit", async () => {
    const fetcher = {
      search: async () => ({ id: "123" }),
      detail: async () => ({ id: "123", url: "u", currency: "PLN",
        prices: { VF: 15 }, mintage: 40000, rarity_index: null }),
    };
    const r = await lookupCoin(fetcher, identity);
    expect(r?.numistaId).toBe("123");
  });
});
