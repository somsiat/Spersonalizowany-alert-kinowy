-- Dodaj brakujące pola powiadomień do tabeli user_prefs
-- Uruchom w Supabase SQL Editor

-- 1. Dodaj pola powiadomień do tabeli user_prefs
ALTER TABLE public.user_prefs 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT false;

-- 2. Sprawdź czy pola zostały dodane
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_prefs' 
AND table_schema = 'public'
ORDER BY ordinal_position;
