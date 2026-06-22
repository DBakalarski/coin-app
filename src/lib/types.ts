export const GRADES = ["VG", "F", "VF", "XF", "AU", "UNC"] as const;
export type Grade = (typeof GRADES)[number];

export interface CoinIdentity {
  country: string;
  year: number | null;
  denomination: string;
  name: string;
  material: string | null;
  mintMark: string | null;
  confidence: "high" | "low";
}

export interface PriceTable {
  currency: string;
  grades: Partial<Record<Grade, number>>;
}

export interface NumistaResult {
  numistaId: string;
  numistaUrl: string;
  priceTable: PriceTable | null;
  mintage: number | null;
  rarityIndex: number | null;
}

export type RarityLabel = "pospolita" | "niezbyt częsta" | "rzadka";
export type ValueSource = "numista" | "ai_estimate" | "manual";

export interface ValueEstimate {
  value: number;
  currency: string;
  source: "ai_estimate";
}

export interface NewCoin {
  frontImagePath: string;
  backImagePath: string;
  identity: CoinIdentity;
  numista: NumistaResult | null;
  selectedGrade: Grade;
  estimatedValue: number | null;
  valueCurrency: string;
  valueSource: ValueSource;
  mintage: number | null;
  rarityLabel: RarityLabel | null;
  purchasePrice: number | null;
  notes: string | null;
}

export interface Coin extends NewCoin {
  id: string;
  ownerId: string;
  createdAt: string;
}
