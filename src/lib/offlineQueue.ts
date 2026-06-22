export interface KvAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

const KEY = "scan-queue";

export function createQueue(adapter: KvAdapter) {
  async function read(): Promise<any[]> {
    const raw = await adapter.get(KEY);
    return raw ? JSON.parse(raw) : [];
  }
  async function write(items: any[]): Promise<void> {
    await adapter.set(KEY, JSON.stringify(items));
  }
  return {
    async enqueue(item: any) {
      const items = await read();
      items.push(item);
      await write(items);
    },
    async drain(send: (item: any) => Promise<boolean>) {
      const items = await read();
      const remaining: any[] = [];
      for (const item of items) {
        const ok = await send(item);
        if (!ok) remaining.push(item);
      }
      await write(remaining);
    },
  };
}
