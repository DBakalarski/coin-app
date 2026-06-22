"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Coin } from "@/lib/types";
import TopBar from "../_components/TopBar";

function coinTitle(c: Coin) {
  return [c.identity.denomination, c.identity.country].filter(Boolean).join(" · ");
}

function medallionLabel(c: Coin) {
  return c.identity.country.slice(0, 2).toUpperCase();
}

export default function CollectionPage() {
  const router = useRouter();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/coins");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError("Nie udało się wczytać kolekcji.");
        setLoading(false);
        return;
      }
      setCoins(await res.json());
      setLoading(false);
    })();
  }, [router]);

  const filtered = coins.filter((c) =>
    c.identity.country.toLowerCase().includes(q.toLowerCase())
  );
  const total = filtered.reduce((s, c) => s + (c.estimatedValue ?? 0), 0);
  const noun =
    coins.length === 1 ? "moneta" : coins.length >= 2 && coins.length <= 4 ? "monety" : "monet";

  return (
    <>
      <TopBar showLogout />
      <main className="shell stack">
        {/* Teza: ile warta jest kolekcja — wybita jak nominał monety */}
        <section className="card card-pad">
          <p className="eyebrow">Wartość kolekcji</p>
          <div className="value" style={{ marginTop: 10 }}>
            <span className="value-num value-hero">{total.toFixed(2)}</span>
            <span className="value-cur">PLN</span>
          </div>
          <div className="reeded" style={{ margin: "16px 0 12px" }} />
          <p className="muted num" style={{ fontSize: "0.9rem" }}>
            {coins.length} {noun} w gablocie
          </p>
        </section>

        {error && <p className="alert">{error}</p>}

        <div className="btn-row" style={{ flexWrap: "nowrap" }}>
          <input
            className="field"
            placeholder="Szukaj po kraju…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Link href="/scan" className="btn btn-primary" style={{ width: "auto", whiteSpace: "nowrap" }}>
            + Skanuj
          </Link>
        </div>

        {loading ? (
          <p className="status">
            <span className="spinner" />
            Otwieram gablotę…
          </p>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-mark" aria-hidden>
              ◎
            </div>
            {coins.length === 0 ? (
              <>
                <p>Gablota jest jeszcze pusta.</p>
                <p className="faint" style={{ marginTop: 4 }}>
                  Zeskanuj pierwszą monetę, by ją wycenić i zachować.
                </p>
              </>
            ) : (
              <p>Brak monet dla „{q}”.</p>
            )}
          </div>
        ) : (
          <ul className="ledger">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link href={`/coins/${c.id}`} className="ledger-row">
                  <span className="medallion" aria-hidden>
                    {medallionLabel(c)}
                  </span>
                  <span className="ledger-main">
                    <span className="ledger-title">{coinTitle(c)}</span>
                    <span className="ledger-sub">
                      {c.identity.year ?? "rok ?"} · stan {c.selectedGrade}
                    </span>
                  </span>
                  <span className="ledger-value">
                    <span className="amount">{c.estimatedValue?.toFixed(2) ?? "—"}</span>{" "}
                    <span className="cur">{c.valueCurrency}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
