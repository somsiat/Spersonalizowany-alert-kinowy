import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pool } from '../db';

/** Front używa min_vote + preferred_cinemas – mapujemy to na user_prefs */
const PrefInSchema = z.object({
  min_vote: z.number().min(0).max(10).optional(),
  preferred_cinemas: z.array(z.union([z.string(), z.number()])).optional(),
  // resztę ignorujemy/utrzymujemy dla zgodności
});

const routes: FastifyPluginAsync = async (app) => {
  app.get('/preferences', async (req: any, reply) => {
    const userId: string | undefined = req.user?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { rows } = await pool.query(
      `select min_imdb, favorite_cinemas, genres, alerts_enabled
       from public.user_prefs where user_id = $1`,
      [userId]
    );

    if (!rows[0]) {
      // defaulty kompatybilne z frontem
      return reply.send({
        user_id: userId,
        min_vote: 0,
        preferred_cinemas: [],
        preferred_genres: [],
        alerts_enabled: true,
      });
    }

    const p = rows[0];
    return reply.send({
      user_id: userId,
      min_vote: Number(p.min_imdb ?? 0),
      preferred_cinemas: (p.favorite_cinemas ?? []).map(String),
      preferred_genres: p.genres ?? [],
      alerts_enabled: p.alerts_enabled ?? true,
    });
  });

  app.post('/preferences', async (req: any, reply) => {
    const userId: string | undefined = req.user?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const parsed = PrefInSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const minImdb = parsed.data.min_vote ?? 0;
    const favCinemas = (parsed.data.preferred_cinemas ?? []).map((x) => Number(x));

    const { rows } = await pool.query(
      `
      insert into public.user_prefs (user_id, min_imdb, favorite_cinemas)
      values ($1,$2,$3)
      on conflict (user_id) do update set
        min_imdb = excluded.min_imdb,
        favorite_cinemas = excluded.favorite_cinemas
      returning user_id, min_imdb, favorite_cinemas
      `,
      [userId, minImdb, favCinemas]
    );

    const p = rows[0];
    return reply.send({
      user_id: userId,
      min_vote: Number(p.min_imdb ?? 0),
      preferred_cinemas: (p.favorite_cinemas ?? []).map(String),
    });
  });
};

export default routes;
