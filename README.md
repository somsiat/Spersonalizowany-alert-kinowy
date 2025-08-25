
# 🎬 Kino Alert — SUPABASE schema compatible (React + Node + Supabase)

Ta wersja repo jest *dopasowana* do istniejącej bazy (tabele/kolumny jak w zrzucie: `cinemas`, `movies`, `showtimes`, `user_prefs`, `subscriptions`, itd.).

## Zawartość
- **apps/web** — React + Vite + TS (formularz preferencji: `min_imdb`, `genres`, `people`; lista dopasowań)
- **apps/api** — Fastify + TS; endpointy dostosowane do `user_prefs`, `subscriptions (jsonb)`, `cinemas`, `showtimes`, `movies`
- **apps/worker** — cron + scraper (szkic) + integracja TMDb → zapis do `movies` i `showtimes` zgodnie z FK i typami `bigint`
- **NOTE:** Ten starter **nie** tworzy tabel — używa Twojego schematu.

## Szybki start

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.example apps/web/.env
# uzupełnij .env (DATABASE_URL, TMDB_API_KEY itd.)

npm run dev:api
npm run dev:web
npm run dev:worker   # uruchomi cron; możesz zatrzymać jeśli chcesz
```

## Co zostało dopasowane
- **IDs**: `bigint` w `cinemas`, `movies`, `showtimes`, `alerts`, ... (brak UUID jak poprzednio)
- **`showtimes`**: kolumny `starts_at`, `source`, `external_url`, `lang`, `format`
- **`movies`**: `tmdb_id` (UNIQUE), `poster_url`, `genres[]`, `directors[]`, `actors[]`, `tmdb_rating`, `imdb_rating`
- **`user_prefs`**: `min_imdb`, `genres[]`, `people[]`, `favorite_cinemas[]`, `favorite_cities[]`
- **`subscriptions`**: `channel` ('email'|'webpush'), `endpoint` (JSONB), `is_active`

## Następne kroki
- Uzupełnij scraper(y) dla konkretnych kin (Playwright + Cheerio)
- (Opcjonalnie) dodać OMDb, by zapisywać `imdb_rating`
