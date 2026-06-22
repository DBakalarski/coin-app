import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/requireOwner";
import { insertCoin, listCoins } from "@/lib/coins/repository";
import type { NewCoin } from "@/lib/types";

export async function GET() {
  let ctx;
  try { ctx = await requireOwner(); } catch (r) { return r as Response; }
  const coins = await listCoins(ctx.supabase);
  return NextResponse.json(coins);
}

export async function POST(request: Request) {
  let ctx;
  try { ctx = await requireOwner(); } catch (r) { return r as Response; }
  const body = await request.json();
  const { frontB64, backB64, coin } = body as { frontB64: string; backB64: string; coin: Omit<NewCoin, "frontImagePath" | "backImagePath"> };

  const stamp = `${ctx.userId}/${Date.now()}`;
  const front = `${stamp}-front.jpg`;
  const back = `${stamp}-back.jpg`;
  const storage = ctx.supabase.storage.from("coin-images");
  const frontUpload = await storage.upload(front, Buffer.from(frontB64, "base64"), { contentType: "image/jpeg" });
  if (frontUpload.error) {
    return NextResponse.json({ error: "Nie udało się zapisać zdjęcia" }, { status: 500 });
  }
  const backUpload = await storage.upload(back, Buffer.from(backB64, "base64"), { contentType: "image/jpeg" });
  if (backUpload.error) {
    // Sprzątamy osierocone zdjęcie awersu, by nie zostawić niespójnego stanu.
    await storage.remove([front]);
    return NextResponse.json({ error: "Nie udało się zapisać zdjęcia" }, { status: 500 });
  }

  const created = await insertCoin(ctx.supabase, ctx.userId, {
    ...coin, frontImagePath: front, backImagePath: back,
  } as NewCoin);
  return NextResponse.json(created, { status: 201 });
}
