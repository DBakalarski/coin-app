import type { Coin, NewCoin, Grade } from "@/lib/types";

export function coinToRow(ownerId: string, c: NewCoin): Record<string, unknown> {
  return {
    owner_id: ownerId,
    front_image_path: c.frontImagePath,
    back_image_path: c.backImagePath,
    country: c.identity.country,
    year: c.identity.year,
    denomination: c.identity.denomination,
    name: c.identity.name,
    material: c.identity.material,
    mint_mark: c.identity.mintMark,
    numista_id: c.numista?.numistaId ?? null,
    numista_url: c.numista?.numistaUrl ?? null,
    price_table: c.numista?.priceTable ?? null,
    selected_grade: c.selectedGrade,
    estimated_value: c.estimatedValue,
    value_currency: c.valueCurrency,
    value_source: c.valueSource,
    mintage: c.mintage,
    rarity_label: c.rarityLabel,
    purchase_price: c.purchasePrice,
    notes: c.notes,
  };
}

export function rowToCoin(row: any): Coin {
  return {
    id: row.id,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    frontImagePath: row.front_image_path,
    backImagePath: row.back_image_path,
    identity: {
      country: row.country, year: row.year, denomination: row.denomination,
      name: row.name, material: row.material, mintMark: row.mint_mark,
      confidence: "high",
    },
    numista: row.numista_id
      ? { numistaId: row.numista_id, numistaUrl: row.numista_url,
          priceTable: row.price_table ?? null, mintage: row.mintage,
          rarityIndex: null }
      : null,
    selectedGrade: row.selected_grade as Grade,
    estimatedValue: row.estimated_value,
    valueCurrency: row.value_currency,
    valueSource: row.value_source,
    mintage: row.mintage,
    rarityLabel: row.rarity_label,
    purchasePrice: row.purchase_price,
    notes: row.notes,
  };
}

type DB = any; // SupabaseClient

export async function insertCoin(db: DB, ownerId: string, c: NewCoin): Promise<Coin> {
  const { data, error } = await db.from("coins").insert(coinToRow(ownerId, c)).select().single();
  if (error) throw error;
  return rowToCoin(data);
}
export async function listCoins(db: DB): Promise<Coin[]> {
  const { data, error } = await db.from("coins").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToCoin);
}
export async function getCoin(db: DB, id: string): Promise<Coin | null> {
  const { data, error } = await db.from("coins").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToCoin(data) : null;
}
export async function updateCoin(db: DB, id: string, patch: Partial<Record<string, unknown>>): Promise<void> {
  const { error } = await db.from("coins").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deleteCoin(db: DB, id: string): Promise<void> {
  const { error } = await db.from("coins").delete().eq("id", id);
  if (error) throw error;
}
