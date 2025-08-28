import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pool } from '../db';

const querySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  minVote: z.coerce.number().min(0).max(10).optional(), // nadpisze user_prefs.min_imdb jeśli podane
  limit: z.coerce.number().int().positive().max(200).default(50),
});

type MatchRow = {
  showtime_id: string; // BIGINT -> string
  cinema_id: string;
  cinema_name: string;
  starts_at: string;
  movie_id: string | null;
  movie_title: string;
  poster_url: string | null;
  rating: number | null;
};

const routes: FastifyPluginAsync = async (app) => {
  app.get('/matches', async (req: any, reply) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
    const { from, to, minVote, limit } = parsed.data;

    const userId: string | undefined = req.user?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const now = new Date();
    const defaultTo = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const timeFrom = from ?? now.toISOString();
    const timeTo = to ?? defaultTo.toISOString();

    const sql = `
      with user_pref as (
        select
          coalesce(min_imdb, 0) as min_imdb,
          coalesce(favorite_cinemas, '{}'::bigint[]) as fav_cinemas
        from public.user_prefs where user_id = $1
      ), base as (
        select
          s.id as showtime_id,
          s.cinema_id,
          c.name as cinema_name,
          s.starts_at,
          m.id as movie_id,
          coalesce(m.title, 'Unknown') as movie_title,
          m.poster_url,
          coalesce(m.imdb_rating, m.tmdb_rating) as rating
        from public.showtimes s
        join public.cinemas c on c.id = s.cinema_id
        left join public.movies m on m.id = s.movie_id
        where s.starts_at >= $2 and s.starts_at <= $3
      )
      select b.showtime_id, b.cinema_id, b.cinema_name, b.starts_at,
             b.movie_id, b.movie_title, b.poster_url, b.rating
      from base b, user_pref p
      where (cardinality(p.fav_cinemas) = 0 or b.cinema_id = any(p.fav_cinemas))
        and ($4::numeric is null or coalesce(b.rating, 0) >= $4)
      order by b.starts_at asc
      limit $5
    `;

    // minVote z query ma pierwszeństwo; jeśli brak, użyj z user_prefs
    const { rows: prefRows } = await pool.query<{ min_imdb: number }>(
      `select coalesce(min_imdb,0) as min_imdb from public.user_prefs where user_id = $1`,
      [userId]
    );
    const effectiveMin = minVote ?? prefRows[0]?.min_imdb ?? 0;

    const params = [userId, timeFrom, timeTo, effectiveMin, limit];
    const { rows } = await pool.query<MatchRow>(sql, params);

    return reply.send({ items: rows });
  });
};

export default routes;
