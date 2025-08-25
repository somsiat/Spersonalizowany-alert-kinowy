
const API = import.meta.env.VITE_API_URL || '';

export async function getMatches() {
  const res = await fetch(API + '/api/matches');
  return res.json();
}

export async function getPrefs() {
  const res = await fetch(API + '/api/preferences');
  return res.json();
}

export async function savePrefs(prefs: any) {
  const res = await fetch(API + '/api/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs)
  });
  return res.json();
}
