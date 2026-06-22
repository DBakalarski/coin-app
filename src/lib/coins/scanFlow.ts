import type { CoinIdentity, NumistaResult, PriceTable, ValueEstimate, ValueSource, RarityLabel } from "@/lib/types";
import { classifyRarity } from "@/lib/rarity/classify";

export interface ScanDeps {
  identify: (f: string, b: string) => Promise<CoinIdentity>;
  lookup: (id: CoinIdentity) => Promise<NumistaResult | null>;
  estimate: (f: string, b: string, id: CoinIdentity) => Promise<ValueEstimate>;
}

export interface ScanResult {
  identity: CoinIdentity;
  numista: NumistaResult | null;
  priceTable: PriceTable | null;
  suggestedValue: number | null;
  valueCurrency: string;
  valueSource: ValueSource;
  mintage: number | null;
  rarityLabel: RarityLabel | null;
}

export async function runScan(deps: ScanDeps, frontB64: string, backB64: string): Promise<ScanResult> {
  const identity = await deps.identify(frontB64, backB64);
  const numista = await deps.lookup(identity);
  const rarityLabel = classifyRarity(numista?.mintage ?? null, numista?.rarityIndex ?? null);

  if (numista?.priceTable) {
    const grades = numista.priceTable.grades;
    const firstVal = Object.values(grades).find((v) => typeof v === "number") ?? null;
    return {
      identity, numista, priceTable: numista.priceTable,
      suggestedValue: firstVal, valueCurrency: numista.priceTable.currency,
      valueSource: "numista", mintage: numista.mintage, rarityLabel,
    };
  }
  const est = await deps.estimate(frontB64, backB64, identity);
  return {
    identity, numista, priceTable: null,
    suggestedValue: est.value, valueCurrency: est.currency,
    valueSource: "ai_estimate", mintage: numista?.mintage ?? null, rarityLabel,
  };
}
