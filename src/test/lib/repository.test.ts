import { describe, it, expect } from "vitest";
import { coinToRow, rowToCoin } from "@/lib/coins/repository";
import type { NewCoin } from "@/lib/types";

const newCoin: NewCoin = {
  frontImagePath: "u1/f.jpg", backImagePath: "u1/b.jpg",
  identity: { country: "Polska", year: 1923, denomination: "5 gr",
    name: "5 gr", material: "mosiądz", mintMark: null, confidence: "high" },
  numista: { numistaId: "123", numistaUrl: "url",
    priceTable: { currency: "PLN", grades: { VF: 15 } }, mintage: 40000, rarityIndex: null },
  selectedGrade: "VF", estimatedValue: 15, valueCurrency: "PLN",
  valueSource: "numista", mintage: 40000, rarityLabel: "rzadka",
  purchasePrice: null, notes: null,
};

describe("coinToRow / rowToCoin", () => {
  it("maps domain to DB row", () => {
    const row = coinToRow("u1", newCoin);
    expect(row.owner_id).toBe("u1");
    expect(row.country).toBe("Polska");
    expect(row.selected_grade).toBe("VF");
    expect((row.price_table as any).grades.VF).toBe(15);
    expect(row.value_source).toBe("numista");
  });
  it("round-trips a DB row back to domain", () => {
    const row = { ...coinToRow("u1", newCoin), id: "c1", created_at: "2026-06-22T00:00:00Z" };
    const coin = rowToCoin(row);
    expect(coin.id).toBe("c1");
    expect(coin.identity.country).toBe("Polska");
    expect(coin.numista?.priceTable?.grades.VF).toBe(15);
    expect(coin.selectedGrade).toBe("VF");
  });
});
