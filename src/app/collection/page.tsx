"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Coin } from "@/lib/types";

export default function CollectionPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { fetch("/api/coins").then((r) => r.json()).then(setCoins); }, []);

  const filtered = coins.filter((c) =>
    c.identity.country.toLowerCase().includes(q.toLowerCase()));
  const total = filtered.reduce((s, c) => s + (c.estimatedValue ?? 0), 0);

  return (
    <main style={{ padding: 16, maxWidth: 640, margin: "0 auto" }}>
      <h1>Moja kolekcja</h1>
      <p>Łączna wartość: <b>{total.toFixed(2)} PLN</b></p>
      <input placeholder="Filtruj po kraju" value={q} onChange={(e) => setQ(e.target.value)} />
      <Link href="/scan" style={{ marginLeft: 8 }}>+ Skanuj</Link>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {filtered.map((c) => (
          <li key={c.id} style={{ borderBottom: "1px solid #ddd", padding: "8px 0" }}>
            <Link href={`/coins/${c.id}`}>
              {c.identity.country} · {c.identity.year ?? "?"} · {c.identity.denomination}
              {" — "}<b>{c.estimatedValue ?? "—"} {c.valueCurrency}</b>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
