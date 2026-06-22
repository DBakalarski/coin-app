"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { downscaleImage } from "@/lib/images";
import { GRADES, type Grade, type CoinIdentity } from "@/lib/types";
import type { ScanResult } from "@/lib/coins/scanFlow";
import TopBar from "../_components/TopBar";

export default function ScanPage() {
  const router = useRouter();
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [grade, setGrade] = useState<Grade>("VF");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"" | "identify" | "price" | "save">("");
  const [scanned, setScanned] = useState<CoinIdentity | null>(null);
  const [error, setError] = useState<string | null>(null);

  function coinLabel(id: CoinIdentity): string {
    return [id.denomination, id.country, id.year ?? ""].filter(Boolean).join(", ");
  }

  function onFrontChange(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    downscaleImage(file)
      .then(setFront)
      .catch(() => setError("Nie udało się wczytać zdjęcia awersu."));
    // Otwórz aparat na rewers od razu (w obrębie gestu użytkownika).
    backInputRef.current?.click();
  }

  function onBackChange(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    downscaleImage(file)
      .then(setBack)
      .catch(() => setError("Nie udało się wczytać zdjęcia rewersu."));
  }

  function reset() {
    setFront(null);
    setBack(null);
    setResult(null);
    setScanned(null);
    setError(null);
    frontInputRef.current?.click();
  }

  async function scan() {
    if (!front || !back) return;
    setBusy(true);
    setError(null);
    setScanned(null);
    try {
      // Etap 1 — rozpoznanie monety.
      setPhase("identify");
      const idRes = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontB64: front, backB64: back }),
      });
      if (idRes.status === 401) {
        router.push("/login");
        return;
      }
      if (!idRes.ok) {
        const body = await idRes.json().catch(() => ({}));
        setError(body.error || `Nie udało się rozpoznać (HTTP ${idRes.status}).`);
        return;
      }
      const { identity } = (await idRes.json()) as { identity: CoinIdentity };
      setScanned(identity);

      // Etap 2 — wycena rozpoznanej monety.
      setPhase("price");
      const prRes = await fetch("/api/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontB64: front, backB64: back, identity }),
      });
      if (prRes.status === 401) {
        router.push("/login");
        return;
      }
      if (!prRes.ok) {
        const body = await prRes.json().catch(() => ({}));
        setError(body.error || `Nie udało się wycenić (HTTP ${prRes.status}).`);
        return;
      }
      const data = await prRes.json();
      setResult(data);
      const firstGrade = data.priceTable
        ? (Object.keys(data.priceTable.grades)[0] as Grade)
        : "VF";
      setGrade(firstGrade);
    } catch {
      setError("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
    } finally {
      setBusy(false);
      setPhase("");
    }
  }

  function valueForGrade(): number | null {
    if (result?.priceTable?.grades?.[grade] != null) return result.priceTable.grades[grade];
    return result?.suggestedValue ?? null;
  }

  async function save() {
    if (!result) return;
    setBusy(true);
    setPhase("save");
    setError(null);
    try {
      const coin = {
        identity: result.identity,
        numista: result.numista,
        selectedGrade: grade,
        estimatedValue: valueForGrade(),
        valueCurrency: result.valueCurrency,
        valueSource: result.valueSource,
        mintage: result.mintage,
        rarityLabel: result.rarityLabel,
        purchasePrice: null,
        notes: null,
      };
      const res = await fetch("/api/coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontB64: front, backB64: back, coin }),
      });
      if (res.ok) router.push("/collection");
      else if (res.status === 401) {
        router.push("/login");
        return;
      } else setError("Nie udało się zapisać.");
    } catch {
      setError("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
    } finally {
      setBusy(false);
      setPhase("");
    }
  }

  const scanning = busy && (phase === "identify" || phase === "price");

  return (
    <>
      <TopBar />
      <main className="shell stack">
        <div>
          <p className="eyebrow">Nowy nabytek</p>
          <h1 style={{ marginTop: 6 }}>Skanuj monetę</h1>
        </div>

        {/* Ukryte wejścia aparatu — sterowane kafelkami / automatem */}
        <input
          ref={frontInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => onFrontChange(e.target)}
        />
        <input
          ref={backInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => onBackChange(e.target)}
        />

        {!result && (
          <div className="stack">
            <p className="muted" style={{ fontSize: "0.92rem" }}>
              Zrób zdjęcie obu stron monety na jednolitym tle. Po awersie aparat
              otworzy się sam na rewers.
            </p>

            <div className="capture">
              <button
                type="button"
                className={`capture-slot${front ? " filled" : ""}`}
                onClick={() => !front && frontInputRef.current?.click()}
              >
                {front ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={front} alt="Podgląd awersu" />
                    <span className="capture-tag">Awers</span>
                  </>
                ) : (
                  <span>
                    <span className="capture-icon" aria-hidden>
                      ⌖
                    </span>
                    <span className="capture-cap">Awers</span>
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`capture-slot${back ? " filled" : ""}`}
                onClick={() => !back && backInputRef.current?.click()}
              >
                {back ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={back} alt="Podgląd rewersu" />
                    <span className="capture-tag">Rewers</span>
                  </>
                ) : (
                  <span>
                    <span className="capture-icon" aria-hidden>
                      ⌖
                    </span>
                    <span className="capture-cap">Rewers</span>
                  </span>
                )}
              </button>
            </div>

            <button
              className="btn btn-primary"
              disabled={!front || !back || busy}
              onClick={scan}
            >
              {scanning ? "Rozpoznaję…" : "Rozpoznaj i wyceń"}
            </button>
            {(front || back) && !busy && (
              <button className="btn btn-quiet" style={{ width: "100%" }} onClick={reset}>
                Zrób zdjęcia od nowa
              </button>
            )}
          </div>
        )}

        {busy && (
          <p className="status">
            <span className="spinner" />
            {phase === "identify" && "Rozpoznaję monetę…"}
            {phase === "price" &&
              (scanned
                ? `Rozpoznano: ${coinLabel(scanned)} — sprawdzam cenę…`
                : "Sprawdzam cenę…")}
            {phase === "save" && "Zapisuję monetę…"}
          </p>
        )}

        {error && <p className="alert">{error}</p>}

        {result && (
          <div className="card card-pad stack">
            <div>
              <p className="eyebrow">Rozpoznano</p>
              <h2 style={{ marginTop: 6 }}>
                {result.identity.denomination} · {result.identity.country}
              </h2>
              <p className="ledger-sub" style={{ marginTop: 4 }}>
                {result.identity.year ?? "rok ?"}
                {result.identity.material ? ` · ${result.identity.material}` : ""}
              </p>
              {result.identity.confidence === "low" && (
                <p className="alert" style={{ marginTop: 12 }}>
                  Niska pewność rozpoznania — sprawdź i popraw dane przed zapisem.
                </p>
              )}
            </div>

            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>
                Stan zachowania
              </p>
              <div className="grades">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className="grade"
                    aria-pressed={grade === g}
                    onClick={() => setGrade(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="reeded" />

            <div>
              <p className="eyebrow">Wartość</p>
              <div className="value" style={{ marginTop: 8 }}>
                <span className="value-num" style={{ fontSize: "2.2rem" }}>
                  {valueForGrade()?.toFixed(2) ?? "—"}
                </span>
                <span className="value-cur">{result.valueCurrency}</span>
              </div>
              <div className="btn-row" style={{ marginTop: 10 }}>
                {result.valueSource === "ai_estimate" ? (
                  <span className="chip">szacunek AI — orientacyjny</span>
                ) : (
                  <span className="chip chip-patina">cena z katalogu</span>
                )}
                {result.rarityLabel && (
                  <span className="chip">
                    {result.rarityLabel} · nakład {result.mintage ?? "?"}
                  </span>
                )}
              </div>
            </div>

            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={save}
            >
              {busy && phase === "save" ? "Zapisuję…" : "Zapisz do kolekcji"}
            </button>
          </div>
        )}
      </main>
    </>
  );
}
