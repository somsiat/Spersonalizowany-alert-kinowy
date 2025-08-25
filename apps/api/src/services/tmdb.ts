
import { env } from '../env';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const HEADERS: any = env.TMDB_API_KEY ? { Authorization: `Bearer ${env.TMDB_API_KEY}` } : {};

export async function tmdbSearchMovie(query: string, year?: number) {
  const u = new URL(TMDB_BASE + '/search/movie');
  u.searchParams.set('query', query);
  if (year) u.searchParams.set('year', String(year));
  const res = await fetch(u, { headers: HEADERS });
  if (!res.ok) throw new Error('TMDb error');
  return res.json();
}

export async function tmdbMovieDetails(id: number) {
  const res = await fetch(`${TMDB_BASE}/movie/${id}?append_to_response=credits`, { headers: HEADERS });
  if (!res.ok) throw new Error('TMDb error');
  return res.json();
}
