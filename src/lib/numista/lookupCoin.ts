import type { CoinIdentity, NumistaResult, PriceTable, Grade } from "@/lib/types";
import { GRADES } from "@/lib/types";

export interface NumistaFetcher {
  search(query: string): Promise<{ id: string } | null>;
  detail(id: string): Promise<any | null>;
}

export function buildSearchQuery(identity: CoinIdentity): string {
  const parts = [identity.denomination, identity.country];
  if (identity.year != null) parts.push(String(identity.year));
  return parts.filter(Boolean).join(" ").trim();
}

export function parseNumistaCoin(detail: any): NumistaResult | null {
  if (!detail || !detail.id) return null;
  const prices: Partial<Record<Grade, number>> = {};
  for (const g of GRADES) {
    const v = detail.prices?.[g];
    if (typeof v === "number") prices[g] = v;
  }
  const priceTable: PriceTable | null =
    Object.keys(prices).length > 0
      ? { currency: String(detail.currency ?? "PLN"), grades: prices }
      : null;
  return {
    numistaId: String(detail.id),
    numistaUrl: String(detail.url ?? ""),
    priceTable,
    mintage: typeof detail.mintage === "number" ? detail.mintage : null,
    rarityIndex: typeof detail.rarity_index === "number" ? detail.rarity_index : null,
  };
}

export async function lookupCoin(
  fetcher: NumistaFetcher, identity: CoinIdentity,
): Promise<NumistaResult | null> {
  const hit = await fetcher.search(buildSearchQuery(identity));
  if (!hit) return null;
  const detail = await fetcher.detail(hit.id);
  return parseNumistaCoin(detail);
}
