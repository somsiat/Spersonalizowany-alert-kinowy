# 🎬 Spersonalizowany Alert Kinowy

Aplikacja webowa (Next.js + React + Supabase), która integruje dane o filmach z API OMDb oraz repertuarami kin. Użytkownik definiuje swoje preferencje (gatunki, reżyserzy, aktorzy, ulubione kina), a system wysyła spersonalizowane powiadomienia o premierach i seansach w wybranych lokalizacjach.

## 🚀 Technologie
- **Next.js 14 (App Router)** – backend + frontend w jednym frameworku
- **React 18** – warstwa UI
- **Supabase** – baza danych, auth, storage
- **OMDb API** – metadane filmów (tytuł, opis, obsada, oceny)
- **Node.js** – logika backendu
- **TailwindCSS** – stylowanie UI

## 📂 Struktura projektu
```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── movies/[imdbId]/    # proxy do OMDb API
│   │   ├── prefs/              # preferencje użytkownika
│   │   ├── cinemas/            # lista kin
│   │   ├── showtimes/          # repertuar
│   │   ├── matches/            # dopasowania wg preferencji
│   │   ├── auth/               # autoryzacja
│   │   ├── scrape/             # scrapery repertuarów
│   │   ├── matching/           # algorytm dopasowywania
│   │   └── notifications/      # system powiadomień
│   ├── test/                   # przykładowa strona testowa
│   ├── layout.tsx
│   └── page.tsx
├── components/                 # komponenty React
│   ├── AuthForm.tsx
│   ├── PreferencesForm.tsx
│   └── MovieMatches.tsx
└── lib/                       # helpery
    ├── supabase.ts
    ├── auth.ts
    ├── omdb.ts
    ├── scrapers.ts
    ├── matching.ts
    └── notifications.ts
```

## ⚙️ Konfiguracja środowiska

1. **Klonuj repozytorium:**
```bash
git clone <repository-url>
cd kino-alert
```

2. **Zainstaluj zależności:**
```bash
npm install
```

3. **Utwórz plik `.env.local` w katalogu głównym:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://axitnoagjitgzfwfmora.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TWÓJ_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TWÓJ_SERVICE_ROLE_KEY

# OMDb
OMDB_API_URL=http://www.omdbapi.com/
OMDB_API_KEY=8d66e46b

# Web Push (opcjonalnie, do powiadomień push)
EMAIL_USER=
EMAIL_PASS=
```

4. **Skonfiguruj bazę danych Supabase:**
   - Uruchom zapytania z pliku `database-schema.sql` w Supabase SQL Editor
   - Skonfiguruj RLS (Row Level Security) policies

5. **Uruchom aplikację:**
```bash
npm run dev
```

## 📌 Funkcjonalności (MVP)

### ✅ Zaimplementowane
- **Rejestracja/logowanie** (Supabase Auth)
- **Ustawianie preferencji filmowych** (gatunki, reżyserzy, aktorzy, kina)
- **Integracja z OMDb API** (metadane filmów)
- **System dopasowywania** (algorytm personalizacji)
- **UI dla preferencji użytkownika** i listy dopasowań
- **Scrapery repertuarów kin** (Helios, Multikino, Cinema City)
- **System powiadomień** (e-mail, push - symulacja)
- **Strona testowa** do debugowania

### 🔄 Do rozszerzenia
- **Prawdziwe scrapery** (Puppeteer/Cheerio zamiast symulacji)
- **Obsługa alertów push/e-mail** (SendGrid, FCM)
- **Cron jobs** do synchronizacji repertuarów
- **Historia alertów** i oceny filmów po obejrzeniu
- **Mobile app** (React Native)

## 🧪 Testowanie

Odwiedź `/test` aby przetestować funkcjonalności backendu:
- Test Movie API
- Uruchomienie scrapingu
- Test algorytmu dopasowywania
- Test systemu powiadomień

## 🔧 API Endpoints

### Filmy
- `GET /api/movies/[imdbId]` - Pobierz dane filmu z OMDb

### Preferencje
- `GET /api/prefs` - Pobierz preferencje użytkownika
- `POST /api/prefs` - Zapisz preferencje użytkownika

### Kina i seanse
- `GET /api/cinemas` - Lista aktywnych kin
- `GET /api/showtimes` - Repertuar (z filtrami)

### Dopasowania
- `GET /api/matches` - Dopasowania dla użytkownika
- `POST /api/matches` - Utwórz nowe dopasowanie

### Autoryzacja
- `POST /api/auth/login` - Logowanie
- `POST /api/auth/register` - Rejestracja
- `POST /api/auth/logout` - Wylogowanie

### System
- `POST /api/scrape` - Uruchom scrapowanie
- `POST /api/matching` - Uruchom dopasowywanie
- `POST /api/notifications` - Uruchom powiadomienia

## 🎯 Algorytm dopasowywania

System oblicza wynik dopasowania na podstawie:
- **Ocena IMDb** (30% wagi) - musi być >= minimalnej oceny użytkownika
- **Gatunki** (30% wagi) - dopasowanie do ulubionych gatunków
- **Reżyser** (20% wagi) - dopasowanie do ulubionych reżyserów
- **Aktorzy** (10% wagi) - dopasowanie do ulubionych aktorów
- **Czas trwania** (10% wagi) - musi być <= maksymalnego czasu

## 📊 Baza danych

### Główne tabele:
- `user_preferences` - preferencje użytkowników
- `cinemas` - lista kin
- `movies` - cache filmów z OMDb
- `showtimes` - repertuar seansów
- `user_matches` - dopasowania dla użytkowników
- `alert_history` - historia powiadomień
- `user_ratings` - oceny filmów przez użytkowników

## 🚀 Deployment

1. **Vercel (zalecane):**
```bash
npm run build
vercel --prod
```

2. **Inne platformy:**
- Upewnij się, że zmienne środowiskowe są ustawione
- Skonfiguruj cron jobs dla scrapingu i powiadomień

## 📝 Licencja

MIT License - zobacz plik LICENSE dla szczegółów.

## 🤝 Współpraca

1. Fork projektu
2. Utwórz branch dla funkcji (`git checkout -b feature/AmazingFeature`)
3. Commit zmian (`git commit -m 'Add some AmazingFeature'`)
4. Push do branch (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

## 📞 Kontakt

W przypadku pytań lub problemów, utwórz issue w repozytorium.