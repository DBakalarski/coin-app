# Money-App — PWA do wyceny monet (projekt)

**Data:** 2026-06-22
**Status:** zatwierdzony projekt, gotowy do planu wdrożenia
**Charakter:** aplikacja osobista, jeden użytkownik (właściciel)

---

## 1. Cel i zakres

Aplikacja PWA na telefon, która:

1. pozwala **zrobić zdjęcia monety** (awers + rewers),
2. **rozpoznaje monetę** ze zdjęcia za pomocą AI (kraj, rok, nominał, nazwa),
3. pobiera **wycenę i dane katalogowe** z darmowego API Numisty (widełki cen wg stanu zachowania, nakład/rzadkość),
4. pozwala użytkownikowi **poprawić dane i wybrać stan zachowania**,
5. **zapisuje monetę** (zdjęcia + dane + wycena) na koncie użytkownika w chmurze,
6. wyświetla **kolekcję** z łączną wartością.

Aplikacja jest wyłącznie do użytku właściciela — odrzuca innych użytkowników.

### Poza zakresem (YAGNI)

- Współdzielenie kolekcji / role / wielu użytkowników.
- Sprzedaż, aukcje, integracje z portalami.
- Rozpoznawanie po zdjęciu w Numiście (płatne, 100 €/mies. — świadomie pomijamy).
- Tryb w pełni offline kolekcji (synchronizacja jest online; patrz kolejkowanie skanów w §7).

---

## 2. Mechanizm wyceny (kluczowa decyzja)

Kolejność ustalania wartości monety:

1. **Cena z Numisty** — po rozpoznaniu monety przez AI robimy zapytanie tekstowe do katalogu Numisty i pobieramy widełki cen wg stanu (VG / F / VF / XF / AU / UNC). To źródło najpewniejsze.
2. **Szacunek AI (zastępczy)** — jeśli Numista nie znajdzie dopasowania lub nie ma ceny, Claude AI szacuje orientacyjną wartość na podstawie zdjęcia i wiedzy o monecie. Taka wartość jest **wyraźnie oznaczona** w UI jako „szacunek AI (orientacyjny)".
3. **Ręczna korekta** — użytkownik zawsze może nadpisać wartość ręcznie.

Stan zachowania (grade) wybiera **użytkownik**, mając monetę w ręku — pokazujemy pełną tabelę widełek cen z Numisty, a wartość monety = cena dla wybranego stanu.

### Dlaczego nie rozpoznawanie po zdjęciu w Numiście

Numista oferuje „search by image", ale wyłącznie w planie płatnym: jednorazowa aktywacja 100 € + minimum 100 €/mies. Dla aplikacji osobistej to nieopłacalne. Rozpoznawanie przejmuje Claude AI (koszt rzędu groszy za zdjęcie), a z Numisty korzystamy tylko z **darmowego** planu (2000 zapytań tekstowych/mies.), który obejmuje dane cenowe i katalogowe.

---

## 3. Stos technologiczny

| Warstwa | Technologia | Uzasadnienie |
|---|---|---|
| Frontend / PWA | **Next.js (App Router) + React**, hosting **Vercel** | PWA z manifestem + service worker, instalacja na telefonie, darmowy hosting, dostęp z dowolnego miejsca |
| Backend | **Next.js API routes** (serverless na Vercel) | Ukrywa klucze API (Claude, Numista) po stronie serwera — nigdy nie trafiają do przeglądarki |
| Baza danych | **Supabase Postgres** | Czysty SQL, łatwy eksport kolekcji, darmowy plan |
| Przechowywanie zdjęć | **Supabase Storage** | Darmowy plan wystarcza na osobistą kolekcję |
| Logowanie | **Supabase Auth** (magic link) | Jedno konto, logowanie bez hasła, długa sesja na telefonie |
| Rozpoznawanie monety | **Claude API** — model z widzeniem, domyślnie `claude-opus-4-8` (opcja taniej: `claude-sonnet-4-6`) | Odczyt kraju/rok/nominału ze zdjęć; structured outputs do zwrotu danych w stałym formacie JSON |
| Ceny i dane katalogowe | **Numista API** (plan darmowy, 2000 zapytań/mies.) | Widełki cen wg stanu, nakład, dane rzadkości |

### Koszty (użytek osobisty)

- Hosting (Vercel) + baza/storage/auth (Supabase): **0 zł** w darmowych planach.
- Numista (plan darmowy): **0 €/mies.**
- Claude API: ok. **kilka–kilkanaście groszy za skan** (2 zdjęcia). Sonnet 4.6 jest tańszy od Opusa 4.8 i zwykle wystarcza do odczytu monety; wybór modelu jest konfigurowalny (zmienna środowiskowa).

---

## 4. Architektura i przepływ

```
Telefon (PWA)                 Backend (Vercel API routes)        Usługi zewnętrzne
─────────────                 ───────────────────────────        ─────────────────
1. Zdjęcia awers+rewers ────► 2. POST /api/scan
                                 - wyślij obrazy do Claude  ────► Claude API (vision)
                                                            ◄──── {kraj, rok, nominał, nazwa, materiał?, znak?}
                                 3. zapytanie do Numisty    ────► Numista API (free)
                                                            ◄──── {numista_id, url, ceny[stan], nakład, rzadkość}
                                 4. jeśli brak ceny:
                                    poproś Claude o szacunek ───► Claude API
   ◄──────────────────────────── 5. zwróć dane + tabelę cen
                                    (+ oznaczenie źródła wyceny)
6. korekta danych, wybór
   stanu, „Zapisz"       ─────► 7. POST /api/coins
                                 - upload zdjęć              ───► Supabase Storage
                                 - insert rekordu            ───► Supabase Postgres
   ◄──────────────────────────── 8. potwierdzenie
```

### Podział na moduły (granice odpowiedzialności)

- **`lib/ai/identifyCoin`** — wejście: 2 obrazy; wyjście: ustrukturyzowane dane monety (Claude vision + structured outputs). Nie wie nic o Numiście ani bazie.
- **`lib/numista/lookupCoin`** — wejście: cechy monety (kraj/rok/nominał); wyjście: wpis katalogowy + tabela cen + nakład/rzadkość, albo `null` (brak dopasowania). Nie wie nic o AI.
- **`lib/ai/estimateValue`** — wejście: obrazy + cechy; wyjście: orientacyjna wartość + waluta, oznaczona jako szacunek AI. Wywoływana tylko gdy `lookupCoin` nie zwróci ceny.
- **`lib/rarity/classify`** — wejście: nakład (+ ew. indeks rzadkości z Numisty); wyjście: etykieta (`pospolita | niezbyt częsta | rzadka`) + surowy nakład. Czysta funkcja, łatwa do testów.
- **`lib/coins/repository`** — zapis/odczyt/edycja/usuwanie monet w Supabase (Postgres + Storage). Jedyne miejsce dotykające bazy.
- **API routes** (`/api/scan`, `/api/coins`, `/api/coins/[id]`) — orkiestracja powyższych modułów; trzymają klucze API.
- **Ekrany** (`/scan`, `/collection`, `/coins/[id]`) — UI; rozmawiają tylko z własnymi API routes, nigdy bezpośrednio z Claude/Numistą.

Każdy moduł ma jasne wejście/wyjście i jest testowalny niezależnie (logikę backendu testujemy na sztucznych odpowiedziach API — patrz §8).

---

## 5. Model danych

### Tabela `coins`

| Pole | Typ | Źródło | Edytowalne |
|---|---|---|---|
| `id` | uuid (PK) | automat | — |
| `owner_id` | uuid | sesja (Supabase Auth) | — |
| `created_at` | timestamptz | automat | — |
| `front_image_path` | text | Storage | — |
| `back_image_path` | text | Storage | — |
| `country` | text | AI | ✅ |
| `year` | int | AI | ✅ |
| `denomination` | text | AI | ✅ |
| `name` | text | AI | ✅ |
| `material` | text \| null | AI | ✅ |
| `mint_mark` | text \| null | AI | ✅ |
| `numista_id` | text \| null | Numista | — |
| `numista_url` | text \| null | Numista | — |
| `price_table` | jsonb \| null | Numista | — |
| `selected_grade` | text | użytkownik | ✅ |
| `estimated_value` | numeric \| null | wyliczane | ✅ (ręczna korekta) |
| `value_currency` | text | Numista/konfiguracja | — |
| `value_source` | enum(`numista` \| `ai_estimate` \| `manual`) | system | — |
| `mintage` | bigint \| null | Numista | — |
| `rarity_label` | text \| null | wyliczane | — |
| `purchase_price` | numeric \| null | użytkownik | ✅ |
| `notes` | text \| null | użytkownik | ✅ |

`price_table` (jsonb), przykład:

```json
{ "currency": "PLN",
  "grades": { "VG": 5.0, "F": 8.0, "VF": 15.0, "XF": 30.0, "AU": 60.0, "UNC": 120.0 } }
```

### Waluta

Pytamy Numistę o ceny w **PLN**, jeśli API to wspiera; w przeciwnym razie zapisujemy oryginalną walutę (zwykle EUR) i przeliczamy orientacyjnie na PLN w UI. Łączna wartość kolekcji sumowana w jednej walucie (PLN).

### Bezpieczeństwo danych (RLS)

Włączone Row-Level Security w Supabase: każdy rekord i każdy plik powiązany z `owner_id`; aplikacja autoryzuje wyłącznie konto właściciela. Inni użytkownicy są odrzucani na poziomie Auth i RLS.

---

## 6. Ekrany (UI)

1. **`/scan` — Skan**
   - Przycisk aparatu → zrób zdjęcie awersu, potem rewersu.
   - Wysyłka do `/api/scan` → ekran potwierdzenia: rozpoznane pola (edytowalne), tabela cen wg stanu, wybór stanu, oznaczenie źródła wyceny (Numista / szacunek AI), pola opcjonalne (cena zakupu, notatka).
   - Przycisk „Zapisz" → `/api/coins`.

2. **`/collection` — Kolekcja**
   - Lista monet: miniatura awersu, kraj/rok/nominał, szacowana wartość.
   - U góry **łączna wartość kolekcji**.
   - Wyszukiwarka/filtr po kraju.

3. **`/coins/[id]` — Szczegóły monety**
   - Duże zdjęcia awersu i rewersu.
   - Wszystkie dane, pełna tabela cen, etykieta rzadkości + nakład, link do Numisty.
   - Edycja pól / zmiana stanu / ręczna korekta wartości / usunięcie.

---

## 7. Obsługa błędów

| Sytuacja | Zachowanie |
|---|---|
| AI nie rozpozna monety pewnie | Pokazuje, co odczytało (z niską pewnością), prosi o ręczne uzupełnienie; nie blokuje zapisu |
| Numista nie znajdzie dopasowania lub brak ceny | Uruchamia **szacunek AI** (oznaczony „szacunek AI (orientacyjny)"); wartość zawsze można nadpisać ręcznie |
| Brak internetu w terenie | Zdjęcia + dane skanu trafiają do kolejki w pamięci telefonu (IndexedDB) i wysyłają się automatycznie po powrocie sieci |
| Błąd API (limit/awaria Claude lub Numisty) | Czytelny komunikat + przycisk „spróbuj ponownie"; zdjęcia nie giną |
| Przekroczony darmowy limit Numisty (2000/mies.) | Zapis monety bez ceny katalogowej + szacunek AI; informacja w UI |

---

## 8. Testowanie

- **TDD dla logiki backendu**: `identifyCoin` (parsowanie odpowiedzi Claude), `lookupCoin` (dopasowanie + parsowanie odpowiedzi Numisty), `estimateValue`, `classify` (rzadkość z nakładu), `repository` (mapowanie rekordów). Testy na **sztucznych (mock) odpowiedziach API** — bez prawdziwych zapytań do Claude/Numisty.
- **Czyste funkcje** (`classify`, mapowanie cen → wybrany stan) testowane wprost.
- **UI** sprawdzane ręcznie na telefonie (instalacja PWA, zrobienie zdjęć, zapis, podgląd kolekcji).
- **Bezpieczeństwo**: klucze API wyłącznie po stronie serwera (zmienne środowiskowe Vercel); RLS w Supabase weryfikuje izolację danych właściciela.

---

## 9. Zmienne środowiskowe (klucze — tylko serwer)

- `ANTHROPIC_API_KEY` — klucz Claude API.
- `CLAUDE_MODEL` — domyślnie `claude-opus-4-8` (opcja: `claude-sonnet-4-6`).
- `NUMISTA_API_KEY` — klucz darmowego planu Numisty.
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase.
- `OWNER_EMAIL` — jedyny dozwolony e-mail logowania.

---

## 10. Kolejność budowy (skrót)

1. Szkielet Next.js + PWA (manifest, service worker) + deploy na Vercel.
2. Supabase: tabela `coins`, Storage, Auth (magic link), RLS, ograniczenie do `OWNER_EMAIL`.
3. `lib/ai/identifyCoin` + `/api/scan` (sam odczyt AI) — z testami.
4. `lib/numista/lookupCoin` + `lib/rarity/classify` — z testami.
5. `lib/ai/estimateValue` (fallback) — z testami.
6. Ekran `/scan` (aparat → potwierdzenie → zapis).
7. `lib/coins/repository` + `/api/coins` + ekran `/collection`.
8. Ekran `/coins/[id]` (szczegóły/edycja/usuwanie).
9. Kolejkowanie offline skanów (IndexedDB) + obsługa błędów.
10. Testy ręczne na telefonie, dopracowanie.
