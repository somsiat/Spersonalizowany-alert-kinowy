
import { useEffect, useState } from 'react';
import { getMatches } from '../lib/api';

export default function MatchesList() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { getMatches().then(setItems); }, []);
  if (!items.length) return <div className="text-gray-500">Brak dopasowań…</div>;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((m, i) => (
        <div key={i} className="bg-white rounded-2xl shadow p-4">
          <div className="font-semibold">{m.title || 'Film'}</div>
          <div className="text-sm text-gray-500">{m.cinema_name} • {new Date(m.starts_at).toLocaleString()}</div>
          {m.poster_url && <img className="mt-2 rounded-xl" src={m.poster_url} />}
          <div className="mt-2 text-sm">
            Ocena: {m.imdb_rating ?? m.tmdb_rating ?? '—'}
          </div>
          <div className="mt-2 text-xs text-gray-600">{(m.genres || []).join(', ')}</div>
          {m.external_url && <a className="inline-block mt-2 text-blue-600 underline" href={m.external_url} target="_blank">Kup bilet</a>}
        </div>
      ))}
    </div>
  );
}
