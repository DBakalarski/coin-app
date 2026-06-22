import type { RarityLabel } from "@/lib/types";

export function classifyRarity(
  mintage: number | null,
  rarityIndex?: number | null,
): RarityLabel | null {
  if (rarityIndex != null) {
    if (rarityIndex >= 90) return "rzadka";
    if (rarityIndex >= 60) return "niezbyt częsta";
    return "pospolita";
  }
  if (mintage == null) return null;
  if (mintage < 50_000) return "rzadka";
  if (mintage < 1_000_000) return "niezbyt częsta";
  return "pospolita";
}
