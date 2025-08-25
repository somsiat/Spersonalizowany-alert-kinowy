
import { FastifyPluginAsync } from 'fastify';
import { pool } from '../db';

const plugin: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    const { rows } = await pool.query('select id, name, city, url, is_active, lat, lon from public.cinemas order by city, name');
    return rows;
  });

  // Używamy :id (bigint) zamiast :slug
  app.get('/:id/showtimes', async (req) => {
    const { id } = (req.params as any);
    const { from, to } = (req.query as any);
    const f = from || new Date().toISOString();
    const t = to || new Date(Date.now()+7*864e5).toISOString();
    const { rows } = await pool.query(
      `select s.*, m.title, m.poster_url, m.tmdb_rating, m.imdb_rating
         from public.showtimes s
         left join public.movies m on m.id = s.movie_id
        where s.cinema_id = $1 and s.starts_at between $2 and $3
        order by s.starts_at asc`,
      [id, f, t]
    );
    return rows;
  });
};

export default plugin;
