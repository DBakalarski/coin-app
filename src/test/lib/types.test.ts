import { describe, it, expect } from "vitest";
import { GRADES } from "@/lib/types";

describe("types", () => {
  it("exposes the fixed grade ladder in order", () => {
    expect(GRADES).toEqual(["VG", "F", "VF", "XF", "AU", "UNC"]);
  });
});
