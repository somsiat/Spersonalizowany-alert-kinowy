
import { FastifyPluginAsync } from 'fastify';
import { pool } from '../db';

const plugin: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', (app as any).authenticate);

  app.get('/', async (req: any) => {
    // 1) Pobierz preferencje
    const { rows: prefRows } = await pool.query('select * from public.user_prefs where user_id = $1', [req.user.id]);
    const prefs = prefRows[0] || { min_imdb: 7.0, genres: [], people: [], favorite_cinemas: [] };

    // 2) Zbuduj zapytanie – warunki opcjonalne
    const now = new Date().toISOString();
    const params: any[] = [now, prefs.min_imdb];
    let idx = params.length;

    let where = `s.starts_at > $1 AND (COALESCE(m.imdb_rating, m.tmdb_rating) >= $2 OR COALESCE(m.imdb_rating, m.tmdb_rating) IS NULL)`;

    if (prefs.favorite_cinemas?.length) {
      params.push(prefs.favorite_cinemas);
      idx += 1;
      where += ` AND s.cinema_id = ANY($${idx}::bigint[])`;
    }
    if (prefs.genres?.length) {
      params.push(prefs.genres);
      idx += 1;
      where += ` AND (m.genres && $${idx}::text[])`;
    }
    if (prefs.people?.length) {
      params.push(prefs.people, prefs.people);
      where += ` AND ((m.actors && $${idx+0}::text[]) OR (m.directors && $${idx+1}::text[]))`;
      idx += 2;
    }

    const { rows } = await pool.query(
      `select s.id as showtime_id, s.starts_at, s.cinema_id, s.lang, s.format, s.external_url,
              c.name as cinema_name, c.city,
              m.id as movie_id, m.title, m.poster_url, m.tmdb_rating, m.imdb_rating, m.genres
         from public.showtimes s
         join public.cinemas c on c.id = s.cinema_id
         left join public.movies m on m.id = s.movie_id
        where ${where}
        order by s.starts_at asc, COALESCE(m.imdb_rating, m.tmdb_rating) desc
        limit 100`,
      params
    );

    return rows;
  });
};

export default plugin;
