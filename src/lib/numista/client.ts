import type { NumistaFetcher } from "@/lib/numista/lookupCoin";

const BASE = "https://api.numista.com/api/v3";

function headers() {
  return { "Numista-API-Key": process.env.NUMISTA_API_KEY ?? "", Accept: "application/json" };
}

// UWAGA: nazwy pól zweryfikuj w dokumentacji Numisty i zmapuj do znormalizowanego kształtu.
export function getNumistaFetcher(): NumistaFetcher {
  return {
    async search(query: string) {
      const url = `${BASE}/coins?q=${encodeURIComponent(query)}&lang=pl&count=1`;
      const res = await fetch(url, { headers: headers() });
      if (!res.ok) return null;
      const data = await res.json();
      const first = data?.coins?.[0];
      return first?.id ? { id: String(first.id) } : null;
    },
    async detail(id: string) {
      const res = await fetch(`${BASE}/coins/${id}?lang=pl`, { headers: headers() });
      if (!res.ok) return null;
      const c = await res.json();
      // mapowanie do znormalizowanego kształtu:
      return {
        id: String(c.id),
        url: c.url ?? `https://en.numista.com/catalogue/pieces${c.id}.html`,
        currency: "PLN",
        prices: normalizePrices(c.prices),
        mintage: extractMintage(c),
        rarity_index: typeof c.rarity === "number" ? c.rarity : null,
      };
    },
  };
}

function normalizePrices(prices: any): Record<string, number> {
  // Numista zwraca ceny per stan; zmapuj klucze na VG/F/VF/XF/AU/UNC.
  const out: Record<string, number> = {};
  if (Array.isArray(prices)) {
    for (const p of prices) {
      const g = String(p.grade ?? "").toUpperCase();
      if (typeof p.price === "number") out[g] = p.price;
    }
  }
  return out;
}

function extractMintage(c: any): number | null {
  const m = c?.issues?.[0]?.mintage ?? c?.mintage;
  return typeof m === "number" ? m : null;
}
