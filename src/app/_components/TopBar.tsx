"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";

/** Górny pasek „gabinetu" — wordmark + opcjonalne wylogowanie. */
export default function TopBar({ showLogout = false }: { showLogout?: boolean }) {
  const router = useRouter();

  async function logout() {
    await getBrowserSupabase().auth.signOut();
    router.push("/login");
  }

  return (
    <header className="topbar">
      <Link href="/collection" className="brand">
        <span className="brand-mark" aria-hidden>
          Ø
        </span>
        Skarbiec
      </Link>
      {showLogout && (
        <button className="btn-quiet btn" onClick={logout}>
          Wyloguj
        </button>
      )}
    </header>
  );
}
