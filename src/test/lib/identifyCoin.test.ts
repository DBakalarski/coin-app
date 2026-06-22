import { describe, it, expect } from "vitest";
import {
  buildIdentifyParams,
  parseIdentityResponse,
  identifyCoin,
} from "@/lib/ai/identifyCoin";

describe("buildIdentifyParams", () => {
  it("includes both images and a json_schema output format", () => {
    const p = buildIdentifyParams("claude-opus-4-8", "AAA", "BBB");
    expect(p.model).toBe("claude-opus-4-8");
    const content = p.messages[0].content as any[];
    const images = content.filter((c) => c.type === "image");
    expect(images).toHaveLength(2);
    expect(images[0].source.data).toBe("AAA");
    expect(images[1].source.data).toBe("BBB");
    expect((p as any).output_config.format.type).toBe("json_schema");
  });
});

describe("parseIdentityResponse", () => {
  it("parses a well-formed JSON identity", () => {
    const id = parseIdentityResponse(
      JSON.stringify({
        country: "Polska", year: 1923, denomination: "5 groszy",
        name: "5 groszy", material: "mosiądz", mint_mark: null, confidence: "high",
      }),
    );
    expect(id.country).toBe("Polska");
    expect(id.year).toBe(1923);
    expect(id.mintMark).toBeNull();
    expect(id.confidence).toBe("high");
  });
  it("defaults missing optionals and low confidence", () => {
    const id = parseIdentityResponse(
      JSON.stringify({ country: "Polska", denomination: "1 zł", name: "1 zł" }),
    );
    expect(id.year).toBeNull();
    expect(id.material).toBeNull();
    expect(id.confidence).toBe("low");
  });
});

describe("identifyCoin", () => {
  it("calls the AI and returns parsed identity", async () => {
    const fake = async () => ({
      content: [{ type: "text", text: JSON.stringify({
        country: "Polska", year: 1990, denomination: "100 zł",
        name: "100 zł", material: null, mint_mark: null, confidence: "high" }) }],
    });
    const id = await identifyCoin(fake, "claude-opus-4-8", "AAA", "BBB");
    expect(id.year).toBe(1990);
  });
});
