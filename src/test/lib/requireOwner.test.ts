import { describe, it, expect, beforeEach } from "vitest";
import { isOwnerEmail } from "@/lib/auth/requireOwner";

beforeEach(() => { process.env.OWNER_EMAIL = "owner@example.com"; });

describe("isOwnerEmail", () => {
  it("accepts the owner (case-insensitive)", () => {
    expect(isOwnerEmail("Owner@Example.com")).toBe(true);
  });
  it("rejects everyone else and null", () => {
    expect(isOwnerEmail("intruder@x.com")).toBe(false);
    expect(isOwnerEmail(null)).toBe(false);
  });
});
