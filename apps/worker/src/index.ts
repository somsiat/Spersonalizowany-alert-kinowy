
import { Pool } from 'pg';
import { bestTitleMatch } from './matchTitle';
import { HeliosScraper } from './scrapers/helios';

const DATABASE_URL = process.env.DATABASE_URL!;
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const pool = new Pool({ connectionString: DATABASE_URL });

const TMDB_BASE = 'https://api.themoviedb.org/3';
const HEADERS: any = TMDB_API_KEY ? { Authorization: `Bearer ${TMDB_API_KEY}` } : {};

async function tmdbSearchMovie(query: string) {
  const u = new URL(TMDB_BASE + '/search/movie');
  u.searchParams.set('query', query);
  const res = await fetch(u, { headers: HEADERS });
  if (!res.ok) throw new Error('TMDb error');
  return res.json();
}
async function tmdbMovieDetails(id: number) {
  const res = await fetch(`${TMDB_BASE}/movie/${id}?append_to_response=credits`, { headers: HEADERS });
  if (!res.ok) throw new Error('TMDb error');
  return res.json();
}

async function upsertMovieFromTmdb(tmdb: any) {
  const year = tmdb.release_date ? Number(tmdb.release_date.slice(0,4)) : null;
  const poster_url = tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : null;
  const details = await tmdbMovieDetails(tmdb.id);
  const runtime_min = details.runtime || null;
  const genres = (details.genres || []).map((g:any)=>g.name);
  const directors = (details.credits?.crew || []).filter((c:any)=>c.job==='Director').map((c:any)=>c.name);
  const actors = (details.credits?.cast || []).slice(0,10).map((c:any)=>c.name);
  const tmdb_rating = tmdb.vote_average || null;

  const { rows } = await pool.query(
    `insert into public.movies (tmdb_id, title, original_title, year, poster_url, runtime_min, genres, directors, actors, tmdb_rating, last_meta_sync)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
     on conflict (tmdb_id) do update set
       title = excluded.title,
       original_title = excluded.original_title,
       year = excluded.year,
       poster_url = excluded.poster_url,
       runtime_min = excluded.runtime_min,
       genres = excluded.genres,
       directors = excluded.directors,
       actors = excluded.actors,
       tmdb_rating = excluded.tmdb_rating,
       last_meta_sync = now()
     returning id`,
    [tmdb.id, tmdb.title, tmdb.original_title, year, poster_url, runtime_min, genres, directors, actors, tmdb_rating]
  );
  return rows[0].id as number;
}

export async function runScrapeAndIngest() {
  const now = new Date();
  const to = new Date(Date.now() + 7*864e5);

  // 1) Pobierz aktywne kina
  const { rows: cinemas } = await pool.query(`select id, url, name from public.cinemas where is_active is true`);

  for (const c of cinemas) {
    let items: any[] = [];
    if (c.name === 'Helios') {
      items = await HeliosScraper.fetchShowtimes(c.url, now, to, Number(c.id));
    } else {
      continue; // obsłuż w następnych adapterach
    }

    for (const it of items) {
      // Dopasuj film do TMDb
      let movie_id: number | null = null;
      try {
        const q = await tmdbSearchMovie(it.movieTitleRaw);
        const match = bestTitleMatch(it.movieTitleRaw, q.results || []);
        if (match) {
          movie_id = await upsertMovieFromTmdb(match);
        }
      } catch {}

      // Deduplikacja: czy taki seans już istnieje?
      const { rows: exists } = await pool.query(
        `select id from public.showtimes
          where cinema_id = $1 and ((movie_id = $2) or ($2 is null and movie_id is null)) and starts_at = $3`,
        [it.cinemaId, movie_id, it.startsAt]
      );
      if (exists.length) continue;

      await pool.query(
        `insert into public.showtimes (cinema_id, movie_id, starts_at, source, external_url, lang, format)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [it.cinemaId, movie_id, it.startsAt, it.source, it.externalUrl || null, it.lang || null, it.format || null]
      );
    }
  }
}
