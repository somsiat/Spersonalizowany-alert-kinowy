
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pool } from '../db';

const schema = z.object({
  min_imdb: z.number().min(0).max(10).default(7.0),
  genres: z.array(z.string()).default([]),
  people: z.array(z.string()).default([]),
  favorite_cinemas: z.array(z.number()).default([]),
  favorite_cities: z.array(z.string()).default([]),
  alerts_enabled: z.boolean().default(true)
});

const plugin: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', (app as any).authenticate);

  app.get('/', async (req: any) => {
    const { rows } = await pool.query('select * from public.user_prefs where user_id = $1', [req.user.id]);
    return rows[0] || { min_imdb: 7.0, genres: [], people: [], favorite_cinemas: [], favorite_cities: [], alerts_enabled: true };
  });

  app.post('/', async (req: any, reply) => {
    const data = schema.parse(req.body);
    await pool.query(
      `insert into public.user_prefs (user_id, min_imdb, genres, people, favorite_cinemas, favorite_cities, alerts_enabled)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (user_id) do update set
         min_imdb = excluded.min_imdb,
         genres = excluded.genres,
         people = excluded.people,
         favorite_cinemas = excluded.favorite_cinemas,
         favorite_cities = excluded.favorite_cities,
         alerts_enabled = excluded.alerts_enabled`,
      [req.user.id, data.min_imdb, data.genres, data.people, data.favorite_cinemas, data.favorite_cities, data.alerts_enabled]
    );
    reply.send({ ok: true });
  });
};

export default plugin;
