import { describe, it, expect } from "vitest";
import { runScan } from "@/lib/coins/scanFlow";

const identity = { country: "Polska", year: 1923, denomination: "5 gr",
  name: "5 gr", material: null, mintMark: null, confidence: "high" as const };

describe("runScan", () => {
  it("uses Numista price when available", async () => {
    const deps = {
      identify: async () => identity,
      lookup: async () => ({ numistaId: "1", numistaUrl: "u",
        priceTable: { currency: "PLN", grades: { VF: 15, UNC: 120 } },
        mintage: 40000, rarityIndex: null }),
      estimate: async () => ({ value: 99, currency: "PLN", source: "ai_estimate" as const }),
    };
    const r = await runScan(deps, "A", "B");
    expect(r.valueSource).toBe("numista");
    expect(r.priceTable?.grades.VF).toBe(15);
    expect(r.rarityLabel).toBe("rzadka");
  });
  it("falls back to AI estimate when no Numista price", async () => {
    const deps = {
      identify: async () => identity,
      lookup: async () => null,
      estimate: async () => ({ value: 30, currency: "PLN", source: "ai_estimate" as const }),
    };
    const r = await runScan(deps, "A", "B");
    expect(r.valueSource).toBe("ai_estimate");
    expect(r.suggestedValue).toBe(30);
  });
});
