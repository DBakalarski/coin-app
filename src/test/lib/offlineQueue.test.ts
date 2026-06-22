import { describe, it, expect } from "vitest";
import { createQueue } from "@/lib/offlineQueue";

describe("offline queue", () => {
  it("stores items and drains them via the sender", async () => {
    const store = new Map<string, string>();
    const adapter = {
      get: async (k: string) => store.get(k) ?? null,
      set: async (k: string, v: string) => { store.set(k, v); },
    };
    const q = createQueue(adapter);
    await q.enqueue({ frontB64: "A", backB64: "B", coin: {} });
    const sent: any[] = [];
    await q.drain(async (item) => { sent.push(item); return true; });
    expect(sent).toHaveLength(1);
    expect(sent[0].frontB64).toBe("A");
    // after a successful drain the queue is empty
    const sent2: any[] = [];
    await q.drain(async (item) => { sent2.push(item); return true; });
    expect(sent2).toHaveLength(0);
  });
  it("keeps items when sender fails", async () => {
    const store = new Map<string, string>();
    const adapter = { get: async (k: string) => store.get(k) ?? null,
      set: async (k: string, v: string) => { store.set(k, v); } };
    const q = createQueue(adapter);
    await q.enqueue({ frontB64: "A", backB64: "B", coin: {} });
    await q.drain(async () => false);
    const sent: any[] = [];
    await q.drain(async (i) => { sent.push(i); return true; });
    expect(sent).toHaveLength(1);
  });
});
