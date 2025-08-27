// apps/worker/src/index.ts
import 'dotenv/config';
import dns from 'node:dns';
import { Pool } from 'pg';
import Bottleneck from 'bottleneck';
import { bestTitleMatch } from './matchTitle';
import { HeliosScraper } from './scrapers/helios';
import type { CinemaScraper, RawShowtime } from './scrapers/types';

// Ustabilizuj rozwiązywanie DNS (Windows potrafi preferować IPv6)
dns.setDefaultResultOrder?.('verbatim');

// -------------------- Konfiguracja --------------------
const DATABASE_URL = process.env.DATABASE_URL!;
const TMDB_API_KEY = process.env.TMDB_API_KEY || ''; // v4 (JWT) lub v3 (plain key)

// ⚠️ Upewnij się, że DATABASE_URL to URI Postgresa z Supabase, np.:
// postgresql://postgres:<haslo>@db.<project_ref>.supabase.co:5432/postgres?sslmode=require
const pool = new Pool({
  connectionString: DATABASE_URL,
  // >>> SSL dla Supabase <<<
  ssl: { rejectUnauthorized: false },
});

// (opcjonalnie) log błędów puli
pool.on('error', (err) => {
  console.error('[pg] pool error', err);
});

// TMDb
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IS_V4 = TMDB_API_KEY.startsWith('ey'); // bardzo prosty heurystyczny check
const HEADERS: Record<string, string> = IS_V4
  ? { Authorization: `Bearer ${TMDB_API_KEY}`, Accept: 'application/json' }
  : { Accept: 'application/json' };

// limiter (2 równoległe, min 300ms między zapytaniami)
const tmdbLimiter = new Bottleneck({ minTime: 300, maxConcurrent: 2 });

// -------------------- Typy minimalne TMDb --------------------
type TmdbGenre = { id: number; name: string };
type TmdbMovieSummary = {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  vote_average: number | null;
  release_date?: string;
};
type TmdbSearchResponse = {
  page: number;
  results: TmdbMovieSummary[];
  total_results: number;
  total_pages: number;
};
type TmdbMovieDetails = {
  id: number;
  title: string;
  original_title: string;
  overview: string | null;
  release_date: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number | null;
  vote_count: number | null;
  genres: TmdbGenre[];
};

// -------------------- Util: querystring + fetch + retry --------------------
function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) u.set(k, String(v));
  }
  return u.toString();
}

async function getJson<T>(url: string): Promise<T> {
  // 3 próby na 5xx
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) return res.json() as Promise<T>;
    if (res.status >= 500) {
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
      continue;
    }
    const text = await res.text().catch(() => '');
    throw new Error(`TMDb ${res.status} ${res.statusText} for ${url}${text ? ' — ' + text : ''}`);
  }
  throw new Error(`TMDb failed after retries for ${url}`);
}

/**
 * Ograniczony (limiterem) call do TMDb z poprawnym typem wynikowym T.
 * Dla v3 automatycznie dokleja ?api_key=...
 * Dla v4 używa Bearer Authorization.
 */
async function tmdbGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined | null> = {}
): Promise<T> {
  const search = qs({
    language: 'pl-PL',
    ...(IS_V4 ? {} : { api_key: TMDB_API_KEY || undefined }), // dla v3
    ...params,
  });
  const url = `${TMDB_BASE}${path}?${search}`;
  return tmdbLimiter.schedule(() => getJson<T>(url));
}

// -------------------- Operacje domenowe --------------------
async function upsertMovie(tmdbId: number) {
  const m = await tmdbGet<TmdbMovieDetails>(`/movie/${tmdbId}`, {
    append_to_response: 'credits,release_dates',
  });

  const genres = (m.genres ?? []).map((g) => g.name);

  await pool.query(
    `
    insert into public.movies
      (id, title, original_title, release_date, overview, poster_path, backdrop_path, tmdb_vote_average, tmdb_vote_count, genres)
    values
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    on conflict (id) do update set
      title=excluded.title,
      original_title=excluded.original_title,
      release_date=excluded.release_date,
      overview=excluded.overview,
      poster_path=excluded.poster_path,
      backdrop_path=excluded.backdrop_path,
      tmdb_vote_average=excluded.tmdb_vote_average,
      tmdb_vote_count=excluded.tmdb_vote_count,
      genres=excluded.genres
    `,
    [
      m.id,
      m.title,
      m.original_title,
      m.release_date || null,
      m.overview || null,
      m.poster_path || null,
      m.backdrop_path || null,
      m.vote_average ?? null,
      m.vote_count ?? null,
      genres,
    ]
  );
}

async function resolveTmdbId(title: string): Promise<number | null> {
  const res = await tmdbGet<TmdbSearchResponse>('/search/movie', {
    query: title,
    include_adult: false,
  });
  const match = bestTitleMatch(title, res.results || []);
  return match?.id ?? null;
}

// -------------------- Scrapers registry --------------------
const scrapers: Record<string, CinemaScraper> = {
  helios: HeliosScraper,
};

// -------------------- Główny job --------------------
export async function runScrapeAndIngest() {
  const client = await pool.connect();
  try {
    const from = new Date();
    const to = new Date(Date.now() + 7 * 864e5);

    // Pobierz źródła do scrapowania
    const { rows: sources } = await client.query(
      `select cs.cinema_id, cs.url, cs.parser_key from public.cinema_sources cs`
    );

    for (const s of sources) {
      const scraper = scrapers[s.parser_key];
      if (!scraper) {
        console.warn('[worker] no scraper for', s.parser_key);
        continue;
      }

      let rows: RawShowtime[] = [];
      try {
        rows = await scraper.fetchShowtimes(s.url, from, to, s.cinema_id);
      } catch (e) {
        console.error('[worker] scraper error', s.parser_key, e);
        continue;
      }

      for (const it of rows) {
        const tmdbId = await resolveTmdbId(it.movieTitleRaw);
        if (tmdbId) await upsertMovie(tmdbId);

        // de-dup check
        const { rows: exists } = await client.query(
          `
          select id
          from public.showtimes
          where cinema_id = $1
            and start_time = $2
            and (
              (tmdb_id is not distinct from $3)
              or (tmdb_id is null and movie_title_raw = $4)
            )
          `,
          [it.cinemaId, it.startsAt, tmdbId, it.movieTitleRaw]
        );
        if (exists.length) continue;

        await client.query(
          `
          insert into public.showtimes
            (cinema_id, tmdb_id, movie_title_raw, start_time, language, format, price)
          values
            ($1,$2,$3,$4,$5,$6,$7)
          `,
          [
            it.cinemaId,
            tmdbId,
            it.movieTitleRaw,
            it.startsAt,
            it.lang || null,
            it.format || null,
            it.price || null,
          ]
        );
      }
    }
  } finally {
    client.release();
  }
}
