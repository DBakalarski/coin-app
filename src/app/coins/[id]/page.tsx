"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Coin } from "@/lib/types";
import TopBar from "../../_components/TopBar";

export default function CoinDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [coin, setCoin] = useState<Coin | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/coins/${id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      setCoin(await res.json());
    })();
  }, [id, router]);

  async function remove() {
    if (!confirm("Usunąć tę monetę z kolekcji?")) return;
    const res = await fetch(`/api/coins/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Nie udało się usunąć monety.");
      return;
    }
    router.push("/collection");
  }

  if (notFound) {
    return (
      <>
        <TopBar />
        <main className="shell">
          <div className="empty">
            <div className="empty-mark" aria-hidden>
              ◎
            </div>
            <p>Nie znaleziono tej monety.</p>
            <Link href="/collection" className="btn btn-quiet" style={{ marginTop: 14 }}>
              Wróć do kolekcji
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (!coin) {
    return (
      <>
        <TopBar />
        <main className="shell">
          <p className="status">
            <span className="spinner" />
            Wczytuję monetę…
          </p>
        </main>
      </>
    );
  }

  const fromCatalog = coin.valueSource === "numista";

  return (
    <>
      <TopBar />
      <main className="shell stack">
        <Link href="/collection" className="eyebrow" style={{ display: "inline-block" }}>
          ← Kolekcja
        </Link>

        <header>
          <p className="muted ledger-sub" style={{ marginBottom: 6 }}>
            {coin.identity.country}
          </p>
          <h1>{coin.identity.denomination}</h1>
          {coin.identity.name && (
            <p className="muted" style={{ marginTop: 6 }}>
              {coin.identity.name}
            </p>
          )}
        </header>

        {/* Wartość — wybita jak nominał */}
        <section className="card card-pad">
          <p className="eyebrow">Wartość · stan {coin.selectedGrade}</p>
          <div className="value" style={{ marginTop: 10 }}>
            <span className="value-num" style={{ fontSize: "2.6rem" }}>
              {coin.estimatedValue?.toFixed(2) ?? "—"}
            </span>
            <span className="value-cur">{coin.valueCurrency}</span>
          </div>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <span className={`chip ${fromCatalog ? "chip-patina" : ""}`}>
              {fromCatalog ? "cena z katalogu" : "szacunek AI — orientacyjny"}
            </span>
            {coin.rarityLabel && <span className="chip">{coin.rarityLabel}</span>}
          </div>
        </section>

        {/* Specyfikacja */}
        <dl className="specs">
          <div className="spec">
            <dt>Rok</dt>
            <dd>{coin.identity.year ?? "—"}</dd>
          </div>
          <div className="spec">
            <dt>Stan</dt>
            <dd>{coin.selectedGrade}</dd>
          </div>
          <div className="spec">
            <dt>Materiał</dt>
            <dd>{coin.identity.material ?? "—"}</dd>
          </div>
          <div className="spec">
            <dt>Nakład</dt>
            <dd className="num">{coin.mintage?.toLocaleString("pl-PL") ?? "—"}</dd>
          </div>
        </dl>

        {/* Cennik katalogowy wg stanu */}
        {coin.numista?.priceTable && (
          <section className="card" style={{ overflow: "hidden" }}>
            <p className="eyebrow" style={{ padding: "14px 16px 0" }}>
              Cennik wg stanu
            </p>
            <table className="pricetable" style={{ marginTop: 6 }}>
              <thead>
                <tr>
                  <th>Stan</th>
                  <th style={{ textAlign: "right" }}>Cena</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(coin.numista.priceTable.grades).map(([g, v]) => (
                  <tr key={g}>
                    <td className="grade-cell">{g}</td>
                    <td>
                      {v} {coin.numista!.priceTable!.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div className="btn-row" style={{ justifyContent: "space-between" }}>
          {coin.numista?.numistaUrl && (
            <a
              className="btn btn-quiet"
              href={coin.numista.numistaUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Zobacz w Numiście ↗
            </a>
          )}
          <button className="btn btn-danger" onClick={remove}>
            Usuń monetę
          </button>
        </div>
      </main>
    </>
  );
}
