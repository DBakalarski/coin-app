"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Coin } from "@/lib/types";

export default function CoinDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [coin, setCoin] = useState<Coin | null>(null);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/coins/${id}`);
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) { setNotFound(true); return; }
      setCoin(await res.json());
    })();
  }, [id, router]);

  async function remove() {
    if (!confirm("Usunąć monetę?")) return;
    const res = await fetch(`/api/coins/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Nie udało się usunąć monety.");
      return;
    }
    router.push("/collection");
  }

  if (notFound) return <main style={{ padding: 16 }}>Nie znaleziono monety.</main>;
  if (!coin) return <main style={{ padding: 16 }}>Ładowanie…</main>;
  return (
    <main style={{ padding: 16, maxWidth: 640, margin: "0 auto" }}>
      <h1>{coin.identity.country} · {coin.identity.year ?? "?"} · {coin.identity.denomination}</h1>
      <p>{coin.identity.name}{coin.identity.material ? ` · ${coin.identity.material}` : ""}</p>
      <p>Stan: <b>{coin.selectedGrade}</b> · Wartość: <b>{coin.estimatedValue ?? "—"} {coin.valueCurrency}</b>
        {coin.valueSource === "ai_estimate" && <em> (szacunek AI)</em>}</p>
      {coin.rarityLabel && <p>Rzadkość: {coin.rarityLabel} (nakład: {coin.mintage ?? "?"})</p>}
      {coin.numista?.priceTable && (
        <table><tbody>
          {Object.entries(coin.numista.priceTable.grades).map(([g, v]) => (
            <tr key={g}><td>{g}</td><td>{v} {coin.numista!.priceTable!.currency}</td></tr>
          ))}
        </tbody></table>
      )}
      {coin.numista?.numistaUrl && <p><a href={coin.numista.numistaUrl} target="_blank" rel="noopener noreferrer">Zobacz w Numiście</a></p>}
      <button onClick={remove} style={{ color: "crimson" }}>Usuń</button>
    </main>
  );
}
