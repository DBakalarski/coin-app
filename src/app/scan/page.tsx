"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fileToBase64 } from "@/lib/images";
import { GRADES, type Grade } from "@/lib/types";
import type { ScanResult } from "@/lib/coins/scanFlow";

export default function ScanPage() {
  const router = useRouter();
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [grade, setGrade] = useState<Grade>("VF");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(side: "front" | "back", file?: File) {
    if (!file) return;
    const b64 = await fileToBase64(file);
    side === "front" ? setFront(b64) : setBack(b64);
  }

  async function scan() {
    if (!front || !back) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/scan", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontB64: front, backB64: back }) });
      if (!res.ok) { setError("Nie udało się rozpoznać. Spróbuj ponownie."); return; }
      const data = await res.json();
      setResult(data);
      const firstGrade = data.priceTable ? (Object.keys(data.priceTable.grades)[0] as Grade) : "VF";
      setGrade(firstGrade);
    } finally {
      setBusy(false);
    }
  }

  function valueForGrade(): number | null {
    if (result?.priceTable?.grades?.[grade] != null) return result.priceTable.grades[grade];
    return result?.suggestedValue ?? null;
  }

  async function save() {
    if (!result) return;
    setBusy(true);
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
      else setError("Nie udało się zapisać.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <h1>Skanuj monetę</h1>
      <label>Awers: <input type="file" accept="image/*" capture="environment"
        onChange={(e) => pick("front", e.target.files?.[0])} /></label>
      <label>Rewers: <input type="file" accept="image/*" capture="environment"
        onChange={(e) => pick("back", e.target.files?.[0])} /></label>
      <button disabled={!front || !back || busy} onClick={scan}>Rozpoznaj</button>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

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
          <button disabled={busy} onClick={save}>Zapisz</button>
        </section>
      )}
    </main>
  );
}
