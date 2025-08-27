// apps/api/src/routes/matches.ts
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pool } from '../db';

const querySchema = z.object({
  from: z.string().datetime().optional(),    // ISO datetime, np. 2025-08-27T00:00:00Z
  to: z.string().datetime().optional(),      // ISO datetime
  minVote: z.coerce.number().min(0).max(10).optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
});

type MatchRow = {
  showtime_id: string;
  cinema_id: string;
  cinema_name: string;
  start_time: string;
  tmdb_id: number | null;
  movie_title: string;
  poster_url: string | null;
  vote_average: number | null;
};

const routes: FastifyPluginAsync = async (app) => {
  app.get('/matches', async (req, reply) => {
    // Walidacja zapytania
    const parsed = querySchema.safeParse((req as any).query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query', details: parsed.error.flatten() });
    }
    const { from, to, minVote, limit } = parsed.data;

    // Użytkownik z JWT (np. Supabase Auth -> preValidation middleware)
    const userId: string | undefined = (req as any).user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Domyślne okno czasu: od teraz do +14 dni
    const now = new Date();
    const defaultTo = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const timeFrom = from ?? now.toISOString();
    const timeTo = to ?? defaultTo.toISOString();

    // Budujemy SQL bez użycia backticków -> brak problemu z „unterminated template literal”
    const sql = [
      'with user_pref as (',
      '  select',
      '    coalesce(min_vote, 0) as min_vote,',
      '    coalesce(preferred_cinemas, \'{}\'::uuid[]) as preferred_cinemas,',
      '    coalesce(preferred_genres, \'{}\'::text[]) as preferred_genres',
      '  from public.preferences',
      '  where user_id = $1',
      '), base as (',
      '  select',
      '    s.id as showtime_id,',
      '    s.cinema_id,',
      '    c.name as cinema_name,',
      '    s.start_time,',
      '    m.tmdb_id,',
      '    coalesce(m.title, s.movie_title_raw) as movie_title,',
      '    m.poster_url,',
      '    m.vote_average',
      '  from public.showtimes s',
      '  join public.cinemas c on c.id = s.cinema_id',
      '  left join public.movies m on m.tmdb_id = s.tmdb_id',
      '  where s.start_time >= $2 and s.start_time <= $3',
      ')',
      'select',
      '  b.showtime_id, b.cinema_id, b.cinema_name, b.start_time,',
      '  b.tmdb_id, b.movie_title, b.poster_url, b.vote_average',
      'from base b, user_pref p',
      'where (cardinality(p.preferred_cinemas) = 0 or b.cinema_id = any(p.preferred_cinemas))',
      '  and ( $4::numeric is null or coalesce(b.vote_average, 0) >= $4 )',
      'order by b.start_time asc',
      'limit $5',
    ].join(' ');

    const params = [
      userId,
      timeFrom,
      timeTo,
      minVote ?? null,
      limit,
    ];

    // Jeśli korzystasz z RLS + GUC w preHandler, wystarczy zwykły pool.query.
    // Jeśli NIE — a chcesz per-request GUC tutaj, odkomentuj blok z clientem.
    //
    // const client = await pool.connect();
    // try {
    //   await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userId })]);
    //   const { rows } = await client.query<MatchRow>(sql, params);
    //   return reply.send({ items: rows });
    // } finally {
    //   client.release();
    // }

    const { rows } = await pool.query<MatchRow>(sql, params);
    return reply.send({ items: rows });
  });
};

export default routes;
