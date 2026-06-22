import { describe, it, expect } from "vitest";
import { parseEstimateResponse, estimateValue } from "@/lib/ai/estimateValue";

describe("parseEstimateResponse", () => {
  it("parses value and forces ai_estimate source/PLN", () => {
    const e = parseEstimateResponse(JSON.stringify({ value: 12.5 }));
    expect(e.value).toBe(12.5);
    expect(e.currency).toBe("PLN");
    expect(e.source).toBe("ai_estimate");
  });
  it("defaults non-numeric value to 0", () => {
    expect(parseEstimateResponse(JSON.stringify({})).value).toBe(0);
  });
});

describe("estimateValue", () => {
  it("calls AI with identity context", async () => {
    let seen: any;
    const fake = async (p: any) => { seen = p; return {
      content: [{ type: "text", text: JSON.stringify({ value: 7 }) }] }; };
    const e = await estimateValue(fake, "claude-opus-4-8", "A", "B",
      { country: "Polska", year: 1923, denomination: "5 gr", name: "5 gr",
        material: null, mintMark: null, confidence: "high" });
    expect(e.value).toBe(7);
    expect(JSON.stringify(seen)).toContain("Polska");
  });
});
