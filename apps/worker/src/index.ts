// apps/worker/src/index.ts
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });

import dns from 'node:dns';
import { Pool } from 'pg';
import Bottleneck from 'bottleneck';
import { bestTitleMatch } from './matchTitle';
import { HeliosScraper } from './scrapers/helios';
import type { CinemaScraper, RawShowtime } from './scrapers/types';

// Ustabilizuj DNS (Windows/IPv6)
dns.setDefaultResultOrder?.('verbatim');

// -------------------- Konfiguracja --------------------
const DATABASE_URL = process.env.DATABASE_URL!;
const TMDB_API_KEY = process.env.TMDB_API_KEY || ''; // v4 (JWT) lub v3 (plain key)
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
pool.on('error', (e) => console.error('[pg] pool error:', e));

// TMDb
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IS_V4 = TMDB_API_KEY.startsWith('ey'); // heurystyka: v4 to JWT
const HEADERS: Record<string, string> = IS_V4
  ? { Authorization: `Bearer ${TMDB_API_KEY}`, Accept: 'application/json' }
  : { Accept: 'application/json' };

// limiter (2 równoległe, min 300ms)
const tmdbLimiter = new Bottleneck({ minTime: 300, maxConcurrent: 2 });

// -------------------- Typy minimalne TMDb --------------------
type TmdbGenre = { id: number; name: string };
type TmdbMovieSummary = {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  vote_average: number | null;
  release_date?: string | null;
};
type TmdbSearchResponse = { page: number; results: TmdbMovieSummary[] };
type TmdbMovieDetails = {
  id: number;
  title: string;
  original_title: string;
  overview: string | null;
  release_date: string | null;
  poster_path: string | null;
  runtime: number | null;
  vote_average: number | null;
  vote_count: number | null;
  genres: TmdbGenre[];
};

// -------------------- Utils --------------------
function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) u.set(k, String(v));
  }
  return u.toString();
}
async function getJson<T>(url: string): Promise<T> {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) return res.json() as Promise<T>;
    if (res.status >= 500) { await new Promise(r => setTimeout(r, 400 * (i + 1))); continue; }
    const text = await res.text().catch(() => '');
    throw new Error(`TMDb ${res.status} ${res.statusText} for ${url}${text ? ' — ' + text : ''}`);
  }
  throw new Error(`TMDb failed after retries for ${url}`);
}
async function tmdbGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined | null> = {}
): Promise<T> {
  const search = qs({
    language: 'pl-PL',
    ...(IS_V4 ? {} : { api_key: TMDB_API_KEY || undefined }),
    ...params,
  });
  const url = `${TMDB_BASE}${path}?${search}`;
  return tmdbLimiter.schedule(() => getJson<T>(url));
}
const yearOf = (s?: string | null) => (s ? Number((/^\d{4}/.exec(s) ?? [])[0]) || null : null);
const posterUrl = (p?: string | null) => (p ? `https://image.tmdb.org/t/p/w500${p}` : null);

// -------------------- Filmy --------------------
/** Upsert filmu po TMDb i zwróć lokalne movies.id (BIGINT jako string) */
async function upsertMovieByTmdb(tmdbId: number): Promise<string> {
  const m = await tmdbGet<TmdbMovieDetails>(`/movie/${tmdbId}`, {
    append_to_response: 'credits,release_dates',
  });

  const genres = (m.genres ?? []).map((g) => g.name);
  const local = await pool.query<{ id: string }>(
    `
    insert into public.movies
      (tmdb_id, title, original_title, year, poster_url, runtime_min, genres, tmdb_rating, last_meta_sync)
    values
      ($1,$2,$3,$4,$5,$6,$7,$8, now())
    on conflict (tmdb_id) do update set
      title=excluded.title,
      original_title=excluded.original_title,
      year=excluded.year,
      poster_url=excluded.poster_url,
      runtime_min=excluded.runtime_min,
      genres=excluded.genres,
      tmdb_rating=excluded.tmdb_rating,
      last_meta_sync=now()
    returning id::text
    `,
    [
      tmdbId,
      m.title,
      m.original_title,
      yearOf(m.release_date),
      posterUrl(m.poster_path),
      m.runtime ?? null,
      genres,
      m.vote_average ?? null,
    ]
  );
  return local.rows[0].id; // jako string – bezpiecznie przenosimy BIGINT
}

// Rozpoznanie TMDb po tytule
async function resolveTmdbId(title: string): Promise<number | null> {
  const res = await tmdbGet<TmdbSearchResponse>('/search/movie', {
    query: title,
    include_adult: false,
  });
  const match = bestTitleMatch(title, res.results || []);
  return match?.id ?? null;
}

// -------------------- Scrapers --------------------
const scrapers: Record<string, CinemaScraper> = {
  helios: HeliosScraper,
};
const keyFromCinemaName = (name: string) => name.toLowerCase().replace(/\s+/g, '_'); // "Cinema City" -> "cinema_city"

// -------------------- Główny job --------------------
export async function runScrapeAndIngest() {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const from = new Date();
    const to = new Date(Date.now() + 7 * 864e5);

    // aktywne kina z URL do repertuaru
    const { rows: cinemas } = await client.query(
      `select id, name, url from public.cinemas where is_active is true`
    );

    type CinemaRow = { id: string; name: string; url: string };
    // rzutujemy BIGINT -> TEXT po stronie SQL (lub Number() w TS)
    const typedCinemas: CinemaRow[] = cinemas.map((r: any) => ({
      id: String(r.id),
      name: r.name as string,
      url: r.url as string,
    }));

    for (const c of typedCinemas) {
      const key = keyFromCinemaName(c.name);       // "Helios" -> "helios"
      const scraper = scrapers[key];
      if (!scraper) { console.warn('[worker] no scraper for', c.name); continue; }

      let rows: RawShowtime[] = [];
      try {
        // ❗ tu było: c.id (bigint) → scraper oczekuje string/number
        rows = await scraper.fetchShowtimes(c.url, from, to, Number(c.id));
      } catch (e) {
        console.error('[worker] scraper error', key, e);
        continue;
      }

      for (const it of rows) {
        // normalizacja daty
        const startsAt = it.startsAt instanceof Date ? it.startsAt : new Date(it.startsAt);

        // Rozpoznaj film po TMDb → upsert do movies → mamy movie_id (BIGINT jako string)
        let movieIdText: string | null = null;
        try {
          const tmdbId = await resolveTmdbId(it.movieTitleRaw);
          if (tmdbId) movieIdText = await upsertMovieByTmdb(tmdbId);
        } catch (e) {
          console.warn('[worker] movie resolve failed for', it.movieTitleRaw, e);
        }

        // Wstaw seans (deduplikacja przez constraint)
        await client.query(
          `
          insert into public.showtimes
            (cinema_id, movie_id, starts_at, version, auditorium, source, external_url, lang, format)
          values
            ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          on conflict on constraint showtimes_cinema_id_movie_id_starts_at_version_key do nothing
          `,
          [
            Number(it.cinemaId),                 // BIGINT
            movieIdText ? Number(movieIdText) : null, // BIGINT (konwertujemy ze stringa)
            startsAt,                            // timestamptz
            it.version ?? null,                  // ✅ pola opcjonalne (dodane w typach)
            it.auditorium ?? null,
            key,                                 // źródło: 'helios' itp.
            it.externalUrl ?? null,
            it.lang ?? null,
            it.format ?? null,
          ]
        );
      }
    }

    await client.query('commit');
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}
