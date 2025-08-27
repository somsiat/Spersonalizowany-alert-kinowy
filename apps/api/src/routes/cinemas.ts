import { FastifyPluginAsync } from 'fastify';

const plugin: FastifyPluginAsync = async (app) => {
  app.get('/', async (req: any) => {
    const { rows } = await req.pg.query(
      'select id, name, city, address, chain, slug from public.cinemas order by city nulls last, name asc'
    );
    return rows;
  });

  // GET /api/cinemas/:id/showtimes?from=ISO&to=ISO
  app.get('/:id/showtimes', async (req: any) => {
    const { id } = (req.params as any);
    const { from, to } = (req.query as any);
    const f = from || new Date().toISOString();
    const t = to || new Date(Date.now() + 7 * 864e5).toISOString();

    const { rows } = await req.pg.query(
      `select s.id, s.cinema_id, s.tmdb_id, s.movie_title_raw, s.start_time, s.language, s.format, s.price,
              m.title, m.original_title, m.poster_path, m.tmdb_vote_average
         from public.showtimes s
         left join public.movies m on m.id = s.tmdb_id
        where s.cinema_id = $1 and s.start_time between $2 and $3
        order by s.start_time asc`,
      [id, f, t]
    );

    // map poster_path -> full TMDb image URL if present
    return rows.map((r: any) => ({
      ...r,
      poster_url: r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : null,
    }));
  });
};

export default plugin;
