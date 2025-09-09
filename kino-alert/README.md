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

### 📋 Wymagania systemowe

**Node.js:** Wersja 18.17.0 lub nowsza (zalecana 20.x)
```bash
# Sprawdź wersję Node.js
node --version

# Sprawdź wersję npm
npm --version
```

**Git:** Do klonowania repozytorium
```bash
# Sprawdź wersję Git
git --version
```

### 🚀 Instalacja krok po kroku

1. **Klonuj repozytorium:**
```bash
git clone https://github.com/somsiat/Spersonalizowany-alert-kinowy.git
cd Spersonalizowany-alert-kinowy/kino-alert
```

2. **Zainstaluj zależności:**
```bash
# Użyj npm (zalecane)
npm install

# Lub yarn (alternatywnie)
yarn install
```

3. **Utwórz plik `.env.local` w katalogu `kino-alert`:**
```env
# Supabase - OBLIGATORYJNE
NEXT_PUBLIC_SUPABASE_URL=https://axitnoagjitgzfwfmora.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TWÓJ_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TWÓJ_SERVICE_ROLE_KEY

# OMDb API - OBLIGATORYJNE
OMDB_API_URL=http://www.omdbapi.com/
OMDB_API_KEY=8d66e46b

# E-mail (opcjonalnie, do powiadomień)
EMAIL_USER=
EMAIL_PASS=

# Web Push (opcjonalnie, do powiadomień push)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

4. **Skonfiguruj bazę danych Supabase:**
   - Uruchom zapytania z pliku `database-schema.sql` w Supabase SQL Editor
   - Skonfiguruj RLS (Row Level Security) policies
   - Upewnij się, że tabele zostały utworzone poprawnie

5. **Uruchom aplikację:**
```bash
# Tryb deweloperski (zalecane)
npm run dev

# Aplikacja będzie dostępna pod adresem:
# http://localhost:3000
```

### 🔧 Rozwiązywanie problemów

**Problem: "Missing script: dev"**
```bash
# Upewnij się, że jesteś w katalogu kino-alert
cd kino-alert
npm run dev
```

**Problem: Błędy zależności**
```bash
# Wyczyść cache i zainstaluj ponownie
rm -rf node_modules package-lock.json
npm install
```

**Problem: Błąd 500 w API**
- Sprawdź czy plik `.env.local` istnieje i ma poprawne klucze
- Upewnij się, że Supabase jest skonfigurowane
- Sprawdź logi w terminalu

**Problem: Filmy nie ładują się**
- Sprawdź połączenie z internetem
- Upewnij się, że OMDb API key jest prawidłowy
- Sprawdź czy baza danych ma tabele

### 📦 Wersje zależności (package.json)

**Główne zależności:**
- Next.js: 15.5.2
- React: 19.1.0
- Supabase: 2.57.2
- TypeScript: 5.x
- TailwindCSS: 3.4.17

**Pełna lista w `package.json`** - nie modyfikuj wersji bez potrzeby!

### 🌐 Porty i adresy

- **Aplikacja:** http://localhost:3000
- **Strona testowa:** http://localhost:3000/test
- **API:** http://localhost:3000/api/...

### ✅ Weryfikacja instalacji

Po uruchomieniu `npm run dev` sprawdź:
1. ✅ Aplikacja ładuje się na http://localhost:3000
2. ✅ Strona testowa działa na http://localhost:3000/test
3. ✅ API `/api/movies/count` zwraca liczbę filmów
4. ✅ Brak błędów w konsoli przeglądarki
5. ✅ Brak błędów w terminalu

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

### 🆕 Nowe funkcjonalności (2024)
- **Wyszukiwanie filmów** po tytule z OMDb API
- **Masowe dodawanie filmów** (do 100 na raz)
- **Automatyczna aktualizacja plakatów** filmów
- **API do pobierania wszystkich filmów** z bazy danych
- **System zarządzania filmami** bez limitów
- **Automatyczne odświeżanie** strony po dodaniu filmów

### 🔄 Do rozszerzenia
- **Prawdziwe scrapery** (Puppeteer/Cheerio zamiast symulacji)
- **Obsługa alertów push/e-mail** (SendGrid, FCM)
- **Cron jobs** do synchronizacji repertuarów
- **Historia alertów** i oceny filmów po obejrzeniu
- **Mobile app** (React Native)

## 🧪 Testowanie

Odwiedź `/test` aby przetestować funkcjonalności backendu:

### 🔧 Podstawowe testy
- **Test Movie API** - testuje integrację z OMDb API
- **Uruchomienie scrapingu** - pobiera repertuary z kin
- **Test algorytmu dopasowywania** - znajduje dopasowania dla użytkowników
- **Test systemu powiadomień** - wysyła powiadomienia o nowych dopasowaniach

### 🆕 Nowe funkcjonalności testowe
- **Wyszukiwanie filmów** - znajdź i dodaj filmy po tytule
- **Masowe dodawanie filmów** - dodaj do 100 filmów na raz
- **Aktualizacja plakatów** - napraw filmy bez plakatów
- **Sprawdzanie liczby filmów** - zobacz ile filmów jest w bazie

### 📊 Strona testowa zawiera:
- Interfejs do wyszukiwania filmów w OMDb API
- Lista popularnych filmów do szybkiego dodania
- Masowy import filmów z listy IMDb ID
- Automatyczna naprawa plakatów filmów
- Szczegółowe raporty z operacji

## 🔧 API Endpoints

### Filmy
- `GET /api/movies` - Pobierz wszystkie filmy z bazy danych
- `GET /api/movies/[imdbId]` - Pobierz dane filmu z OMDb
- `GET /api/movies/search?q=tytuł` - Wyszukaj filmy po tytule
- `GET /api/movies/count` - Liczba filmów w bazie
- `POST /api/movies/bulk-add` - Masowe dodawanie filmów
- `POST /api/movies/update-posters` - Aktualizacja plakatów
- `POST /api/movies/fix-specific` - Napraw konkretne filmy

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