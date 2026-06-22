import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/requireOwner";
import { getAiCaller, getModel } from "@/lib/ai/client";
import { getNumistaFetcher } from "@/lib/numista/client";
import { estimateValue } from "@/lib/ai/estimateValue";
import { lookupCoin } from "@/lib/numista/lookupCoin";
import { priceCoin } from "@/lib/coins/scanFlow";
import type { CoinIdentity } from "@/lib/types";

export async function POST(request: Request) {
  try {
    await requireOwner();
  } catch (res) {
    return res as Response;
  }
  let frontB64: string, backB64: string, identity: CoinIdentity;
  try {
    ({ frontB64, backB64, identity } = await request.json());
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe żądanie" }, { status: 400 });
  }
  if (!identity) {
    return NextResponse.json({ error: "Brak danych monety" }, { status: 400 });
  }
  const ai = getAiCaller();
  const model = getModel();
  const numista = getNumistaFetcher();
  try {
    const result = await priceCoin(
      {
        // Awaria Numisty nie powinna psuć wyceny — degraduj do szacunku AI.
        lookup: async (id) => {
          try {
            return await lookupCoin(numista, id);
          } catch {
            return null;
          }
        },
        estimate: (f, b, id) => estimateValue(ai, model, f, b, id),
      },
      identity, frontB64, backB64,
    );
    return NextResponse.json(result);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("price error:", detail);
    return NextResponse.json({ error: `Błąd wyceny: ${detail}` }, { status: 502 });
  }
}
