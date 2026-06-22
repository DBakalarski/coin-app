import { describe, it, expect } from "vitest";
import { stripDataUrlPrefix } from "@/lib/images";

describe("stripDataUrlPrefix", () => {
  it("removes the data URL header, keeping base64 payload", () => {
    expect(stripDataUrlPrefix("data:image/jpeg;base64,AAABBB")).toBe("AAABBB");
  });
  it("returns input unchanged when no prefix", () => {
    expect(stripDataUrlPrefix("AAABBB")).toBe("AAABBB");
  });
});
