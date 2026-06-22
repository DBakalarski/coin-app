import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/requireOwner";
import { getCoin, updateCoin, deleteCoin } from "@/lib/coins/repository";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let ctx; try { ctx = await requireOwner(); } catch (r) { return r as Response; }
  const { id } = await params;
  const coin = await getCoin(ctx.supabase, id);
  return coin ? NextResponse.json(coin) : NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let ctx; try { ctx = await requireOwner(); } catch (r) { return r as Response; }
  const { id } = await params;
  const patch = await req.json(); // klucze kolumnowe: selected_grade, estimated_value, value_source, notes, purchase_price...
  await updateCoin(ctx.supabase, id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let ctx; try { ctx = await requireOwner(); } catch (r) { return r as Response; }
  const { id } = await params;
  await deleteCoin(ctx.supabase, id);
  return NextResponse.json({ ok: true });
}
