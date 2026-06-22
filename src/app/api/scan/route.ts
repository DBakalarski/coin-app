import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/requireOwner";
import { runScan } from "@/lib/coins/scanFlow";
import { getAiCaller, getModel } from "@/lib/ai/client";
import { getNumistaFetcher } from "@/lib/numista/client";
import { identifyCoin } from "@/lib/ai/identifyCoin";
import { estimateValue } from "@/lib/ai/estimateValue";
import { lookupCoin } from "@/lib/numista/lookupCoin";

export async function POST(request: Request) {
  try {
    await requireOwner();
  } catch (res) {
    return res as Response;
  }
  let frontB64: string, backB64: string;
  try {
    ({ frontB64, backB64 } = await request.json());
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe żądanie" }, { status: 400 });
  }
  if (!frontB64 || !backB64) {
    return NextResponse.json({ error: "Brak zdjęć" }, { status: 400 });
  }
  const ai = getAiCaller();
  const model = getModel();
  const numista = getNumistaFetcher();
  try {
    const result = await runScan(
      {
        identify: (f, b) => identifyCoin(ai, model, f, b),
        lookup: (id) => lookupCoin(numista, id),
        estimate: (f, b, id) => estimateValue(ai, model, f, b, id),
      },
      frontB64, backB64,
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "Błąd rozpoznawania" }, { status: 502 });
  }
}
