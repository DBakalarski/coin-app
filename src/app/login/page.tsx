"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError("Błędny e-mail lub hasło.");
        return;
      }
      router.push("/collection");
    } catch {
      setError("Nie udało się zalogować. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="shell"
      style={{ minHeight: "100dvh", display: "grid", placeItems: "center", maxWidth: 420 }}
    >
      <div className="stack" style={{ width: "100%" }}>
        <div style={{ textAlign: "center" }}>
          <span className="brand-mark" aria-hidden style={{ margin: "0 auto 14px" }}>
            Ø
          </span>
          <p className="eyebrow">Gabinet numizmatyczny</p>
          <h1 style={{ marginTop: 6 }}>Skarbiec</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Twoja prywatna kolekcja monet. Zaloguj się, by wejść.
          </p>
        </div>

        <div className="reeded" />

        <div className="card card-pad stack-sm">
          <input
            type="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            autoComplete="username"
          />
          <input
            type="password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") login();
            }}
            placeholder="Hasło"
            autoComplete="current-password"
          />
          <button className="btn btn-primary" onClick={login} disabled={busy}>
            {busy ? "Loguję…" : "Zaloguj"}
          </button>
          {error && <p className="alert">{error}</p>}
        </div>
      </div>
    </main>
  );
}
