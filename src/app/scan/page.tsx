"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { downscaleImage } from "@/lib/images";
import { GRADES, type Grade, type CoinIdentity } from "@/lib/types";
import type { ScanResult } from "@/lib/coins/scanFlow";

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
    downscaleImage(file).then(setFront).catch(() => setError("Nie udało się wczytać zdjęcia awersu."));
    // Otwórz aparat na rewers od razu (w obrębie gestu użytkownika).
    backInputRef.current?.click();
  }

  function onBackChange(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    downscaleImage(file).then(setBack).catch(() => setError("Nie udało się wczytać zdjęcia rewersu."));
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
    setBusy(true); setError(null); setScanned(null);
    try {
      // Etap 1 — rozpoznanie monety.
      setPhase("identify");
      const idRes = await fetch("/api/identify", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontB64: front, backB64: back }) });
      if (idRes.status === 401) { router.push("/login"); return; }
      if (!idRes.ok) {
        const body = await idRes.json().catch(() => ({}));
        setError(body.error || `Nie udało się rozpoznać (HTTP ${idRes.status}).`);
        return;
      }
      const { identity } = (await idRes.json()) as { identity: CoinIdentity };
      setScanned(identity);

      // Etap 2 — wycena rozpoznanej monety.
      setPhase("price");
      const prRes = await fetch("/api/price", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontB64: front, backB64: back, identity }) });
      if (prRes.status === 401) { router.push("/login"); return; }
      if (!prRes.ok) {
        const body = await prRes.json().catch(() => ({}));
        setError(body.error || `Nie udało się wycenić (HTTP ${prRes.status}).`);
        return;
      }
      const data = await prRes.json();
      setResult(data);
      const firstGrade = data.priceTable ? (Object.keys(data.priceTable.grades)[0] as Grade) : "VF";
      setGrade(firstGrade);
    } catch {
      setError("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
    } finally {
      setBusy(false); setPhase("");
    }
  }

  function valueForGrade(): number | null {
    if (result?.priceTable?.grades?.[grade] != null) return result.priceTable.grades[grade];
    return result?.suggestedValue ?? null;
  }

  async function save() {
    if (!result) return;
    setBusy(true); setPhase("save"); setError(null);
    try {
      const coin = {
        identity: result.identity, numista: result.numista,
        selectedGrade: grade, estimatedValue: valueForGrade(),
        valueCurrency: result.valueCurrency, valueSource: result.valueSource,
        mintage: result.mintage, rarityLabel: result.rarityLabel,
        purchasePrice: null, notes: null,
      };
      const res = await fetch("/api/coins", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontB64: front, backB64: back, coin }) });
      if (res.ok) router.push("/collection");
      else if (res.status === 401) { router.push("/login"); return; }
      else setError("Nie udało się zapisać.");
    } catch {
      setError("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
    } finally {
      setBusy(false); setPhase("");
    }
  }

  return (
    <main style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <h1>Skanuj monetę</h1>

      {/* Ukryte wejścia aparatu — sterowane przyciskami / automatem */}
      <input ref={frontInputRef} type="file" accept="image/*" capture="environment"
        style={{ display: "none" }} onChange={(e) => onFrontChange(e.target)} />
      <input ref={backInputRef} type="file" accept="image/*" capture="environment"
        style={{ display: "none" }} onChange={(e) => onBackChange(e.target)} />

      {!result && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {!front && (
            <button onClick={() => frontInputRef.current?.click()} style={{ padding: 14 }}>
              📷 Zrób zdjęcie awersu
            </button>
          )}
          {front && (
            <p>Awers: ✅ gotowy</p>
          )}
          {front && !back && (
            <button onClick={() => backInputRef.current?.click()} style={{ padding: 14 }}>
              📷 Zrób zdjęcie rewersu
            </button>
          )}
          {back && (
            <p>Rewers: ✅ gotowy</p>
          )}
          {(front || back) && (
            <button onClick={reset} disabled={busy} style={{ padding: 8 }}>
              Zrób zdjęcia od nowa
            </button>
          )}
          <button disabled={!front || !back || busy} onClick={scan} style={{ padding: 14 }}>
            {busy && (phase === "identify" || phase === "price") ? "Rozpoznaję…" : "Rozpoznaj"}
          </button>
        </section>
      )}

      {busy && (
        <p className="status">
          <span className="spinner" />
          {phase === "identify" && "Rozpoznaję monetę…"}
          {phase === "price" &&
            (scanned ? `Rozpoznano: ${coinLabel(scanned)} — sprawdzam cenę…` : "Sprawdzam cenę…")}
          {phase === "save" && "Zapisuję monetę…"}
        </p>
      )}

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}

      {result && (
        <section style={{ marginTop: 16 }}>
          <p><b>{result.identity.country}</b> · {result.identity.year ?? "?"} · {result.identity.denomination}</p>
          {result.identity.confidence === "low" && <p>⚠️ Niska pewność — popraw dane ręcznie.</p>}
          <p>Stan zachowania:
            <select value={grade} onChange={(e) => setGrade(e.target.value as Grade)}>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </p>
          <p>Wartość: <b>{valueForGrade() ?? "—"} {result.valueCurrency}</b>{" "}
            {result.valueSource === "ai_estimate" && <em>(szacunek AI — orientacyjny)</em>}</p>
          {result.rarityLabel && <p>Rzadkość: {result.rarityLabel} (nakład: {result.mintage ?? "?"})</p>}
          <button disabled={busy} onClick={save}>
            {busy && phase === "save" ? "Zapisuję…" : "Zapisz"}
          </button>
        </section>
      )}
    </main>
  );
}
