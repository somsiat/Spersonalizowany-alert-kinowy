import { createClient } from '@supabase/supabase-js';

const API = import.meta.env.VITE_API_URL || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON!;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  const missing = [
    !SUPABASE_URL && 'VITE_SUPABASE_URL',
    !SUPABASE_ANON && 'VITE_SUPABASE_ANON',
  ].filter(Boolean).join(', ');
  // Nie wypluwamy kluczy – tylko informujemy czego brakuje
  console.error(`[env] Brak zmiennych: ${missing}. Dodaj je do apps/web/.env.local i zrestartuj dev server.`);
  throw new Error(`Missing env: ${missing}`);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function authFetch(path: string, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers || {});
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  return fetch(API + path, { ...init, headers });
}

export async function getMatches() {
  const res = await authFetch('/api/matches');
  return res.json();
}

export async function getPrefs() {
  const res = await authFetch('/api/preferences');
  return res.json();
}

export async function savePrefs(prefs: any) {
  const res = await authFetch('/api/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs)
  });
  return res.json();
}

export async function subscribePush(sub: PushSubscriptionJSON) {
  const res = await authFetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub)
  });
  return res.json();
}

console.log('[env check]', {
  hasUrl: !!SUPABASE_URL,
  hasAnon: !!SUPABASE_ANON,
  api: API
});