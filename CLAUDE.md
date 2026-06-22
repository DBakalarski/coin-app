@AGENTS.md

# money-app — osobista PWA do wyceny monet

Aplikacja **tylko dla właściciela**: robisz zdjęcia monety (awers + rewers),
Claude (vision) rozpoznaje ją, darmowa Numista podaje cenę wg stanu (lub
Claude szacuje wartość zastępczo, oznaczoną), wybierasz stan i zapisujesz
monetę w Supabase. UI jest **po polsku**.

Specyfikacja i plan: `docs/superpowers/`. Dziennik decyzji/recenzji budowy:
`.git/sdd/progress.md`.

## Stos

- **Next.js (App Router) + React, TypeScript** — front + serverless API routes.
- **Supabase** — Postgres + Storage + Auth (RLS tylko dla właściciela).
- **Claude API** (`@anthropic-ai/sdk`) — rozpoznawanie + szacunek wartości.
- **Numista API** (plan darmowy) — ceny katalogowe wg stanu.
- **Vitest** — testy logiki. Hosting: **Vercel**.

## Komendy

```bash
npm run dev      # serwer deweloperski
npm test         # Vitest (vitest run)
npx tsc --noEmit # typecheck
npm run build    # build produkcyjny (next build)
```

Node 22. Przed commitem: `npm test` zielone + `tsc --noEmit` czyste.
Uwaga (Next 16): `tsc --noEmit` wymaga `.next/types/...` — nie kasuj `.next`;
w razie błędu o `routes.d.ts` uruchom raz `npx next build`.

## Architektura (warstwy)

Logika oddzielona od I/O — testowana z atrapami, bez prawdziwych wywołań sieci:

- `src/lib/*` — **czysta logika** (testowana): `ai/identifyCoin`, `ai/estimateValue`,
  `numista/lookupCoin`, `rarity/classify`, `coins/scanFlow` (`runScan`/`priceCoin`),
  `coins/repository` (mapowanie wiersz↔domena + CRUD), `images` (`downscaleImage`),
  `offlineQueue`, `types`.
- `src/lib/ai/client.ts`, `src/lib/numista/client.ts`, `src/lib/supabase/*` —
  **adaptery I/O** (czytają klucze z `process.env`, bez testów jednostkowych).
- `src/app/api/*` — **trasy** (orkiestracja + `requireOwner`): `identify`, `price`,
  `scan` (łączony, starszy), `coins`, `coins/[id]`.
- `src/app/{login,scan,collection,coins/[id]}` — **ekrany** (rozmawiają tylko z `/api/*`).

Skanowanie jest dwuetapowe dla narracji na żywo: `/api/identify` → `/api/price`.

## Bezpieczeństwo / auth

- **Tylko właściciel.** `requireOwner()` sprawdza `email === OWNER_EMAIL`; każda
  chroniona trasa zwraca rzucony 401/403. Do tego **RLS** w Supabase (`auth.uid() = owner_id`).
- **Klucze API wyłącznie po stronie serwera** — `process.env`, nigdy `NEXT_PUBLIC_*`
  dla sekretów, nigdy w kodzie klienta.
- Logowanie: **e-mail + hasło** (`signInWithPassword`); konto tworzone raz w panelu
  Supabase (Authentication → Users, Auto Confirm). Magic-link został porzucony
  (limit darmowej poczty); trasa `/auth/callback` jest nieużywana.

## Zmienne środowiskowe (lokalnie `.env.local`, na Vercelu Production)

```
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-6   # opcjonalna; domyślnie claude-opus-4-8
NUMISTA_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # klucz publishable (sb_publishable_...) lub legacy anon
OWNER_EMAIL=
# SUPABASE_SERVICE_ROLE_KEY — NIEUŻYWANY, zostaw pusty
```

`NEXT_PUBLIC_*` są wpiekane przy buildzie → po zmianie zrób restart dev / redeploy.

## Supabase (raz na projekt)

1. SQL Editor → uruchom `supabase/schema.sql` (tabela `coins` + RLS + prywatny
   bucket `coin-images` + polityki storage). Edytor musi być w trybie zapisu.
2. Authentication → Email provider włączony; utwórz użytkownika (e-mail = `OWNER_EMAIL`).

## Deploy

- GitHub: `DBakalarski/coin-app`, gałąź `main`. **Push na `main` = auto-redeploy na Vercelu.**
- Zdjęcia są pomniejszane w przeglądarce (`downscaleImage`, ≤1280px JPEG) — trzyma
  żądanie poniżej limitu ~4,5 MB Vercela i obniża koszt AI.

## Konwencje

- **TDD** dla logiki: test przed implementacją, atrapy zamiast prawdziwych API.
- **Claude:** `thinking: { type: "adaptive" }`, structured outputs przez
  `output_config.format`. NIE używać `budget_tokens`/`temperature`/`top_p`
  (zwracają 400 na Opus 4.8 i Sonnet 4.6 w trybie adaptive).
- Numista: **wyłącznie plan darmowy** (endpointy tekstowe/cenowe), nigdy „search by image".
- Stany zachowania: stały zbiór `VG | F | VF | XF | AU | UNC`. Waluta: PLN.

## Znane follow-upy / pułapki

1. **Numista — mapowanie pól niezweryfikowane** (`src/lib/numista/client.ts`,
   komentarz `// UWAGA`). Jeśli wycena zawsze pokazuje „szacunek AI" zamiast ceny
   z katalogu, to znak, że nazwy pól odpowiedzi v3 trzeba dopasować do realnego API.
2. **PWA = tylko manifest** (instalowalna), bez service workera — `@ducanh2912/next-pwa`
   niekompatybilny z Next 16/Turbopack. Ikony to placeholdery. Cache offline wymaga
   SW kompatybilnego z Turbopackiem (np. Serwist).
3. **Kolejka offline** (`offlineQueue.createQueue`) gotowa i przetestowana, ale
   **niepodpięta** do ekranu skanu.
4. **PATCH `/api/coins/[id]`** przyjmuje klucze kolumnowe (snake_case) bez białej listy
   — przy dodawaniu edycji UI ograniczyć do edytowalnych kolumn.
