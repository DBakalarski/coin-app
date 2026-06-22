import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/requireOwner";
import { getAiCaller, getModel } from "@/lib/ai/client";
import { identifyCoin } from "@/lib/ai/identifyCoin";

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
  try {
    const identity = await identifyCoin(getAiCaller(), getModel(), frontB64, backB64);
    return NextResponse.json({ identity });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("identify error:", detail);
    return NextResponse.json({ error: `Błąd rozpoznawania: ${detail}` }, { status: 502 });
  }
}
