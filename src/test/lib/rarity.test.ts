import { describe, it, expect } from "vitest";
import { classifyRarity } from "@/lib/rarity/classify";

describe("classifyRarity", () => {
  it("returns null when no data", () => {
    expect(classifyRarity(null, null)).toBeNull();
  });
  it("classifies by mintage when no rarity index", () => {
    expect(classifyRarity(20_000, null)).toBe("rzadka");
    expect(classifyRarity(500_000, null)).toBe("niezbyt częsta");
    expect(classifyRarity(2_000_000, null)).toBe("pospolita");
  });
  it("prefers rarity index over mintage", () => {
    expect(classifyRarity(2_000_000, 95)).toBe("rzadka");
    expect(classifyRarity(20_000, 10)).toBe("pospolita");
  });
});
