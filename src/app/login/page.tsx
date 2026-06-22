"use client";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function send() {
    try {
      const supabase = getBrowserSupabase();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (authError) throw authError;
      setSent(true);
    } catch {
      setError("Nie udało się wysłać linku. Spróbuj ponownie.");
    }
  }
  return (
    <main style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <h1>Logowanie</h1>
      {sent ? (
        <p>Sprawdź skrzynkę — wysłaliśmy link do logowania.</p>
      ) : (
        <>
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Twój e-mail" style={{ width: "100%", padding: 12 }} />
          <button onClick={send} style={{ marginTop: 12, padding: 12 }}>
            Wyślij link
          </button>
          {error && <p style={{ color: "crimson", marginTop: 8 }}>{error}</p>}
        </>
      )}
    </main>
  );
}
