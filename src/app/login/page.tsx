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
    <main style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <h1>Logowanie</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mail"
        autoComplete="username"
        style={{ width: "100%", padding: 12, marginBottom: 8 }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") login();
        }}
        placeholder="Hasło"
        autoComplete="current-password"
        style={{ width: "100%", padding: 12 }}
      />
      <button onClick={login} disabled={busy} style={{ marginTop: 12, padding: 12 }}>
        Zaloguj
      </button>
      {error && <p style={{ color: "crimson", marginTop: 8 }}>{error}</p>}
    </main>
  );
}
