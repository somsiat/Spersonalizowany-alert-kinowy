# Spersonalizowany-alert-kinowy


## ⚙️ Konfiguracja środowiska
Utwórz plik `.env.local` w katalogu głównym i wklej:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://axitnoagjitgzfwfmora.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TWÓJ_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TWÓJ_SERVICE_ROLE_KEY  # tylko na backendzie

# OMDb
OMDB_API_URL=http://www.omdbapi.com/
OMDB_API_KEY=8d66e46b

# Web Push (opcjonalnie, do powiadomień push)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
