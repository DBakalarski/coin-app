"use client";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  async function send() {
    const supabase = getBrowserSupabase();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setSent(true);
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
        </>
      )}
    </main>
  );
}
