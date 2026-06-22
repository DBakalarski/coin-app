import { describe, it, expect } from "vitest";
import { greeting } from "@/lib/smoke";

describe("smoke", () => {
  it("returns app name", () => {
    expect(greeting()).toBe("money-app");
  });
});
