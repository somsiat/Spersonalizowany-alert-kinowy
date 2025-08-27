import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const schema = z.object({
  min_vote: z.number().min(0).max(10).default(6.5),
  preferred_genres: z.array(z.string()).default([]),
  preferred_people: z.array(z.string()).default([]),
  preferred_cinemas: z.array(z.string()).default([]), // uuid[]
  exclude_genres: z.array(z.string()).default([])
});

const plugin: FastifyPluginAsync = async (app) => {
  // Require auth
  app.addHook('preHandler', async (req: any, reply: any) => {
    const fn = (app as any).authenticate;
    if (typeof fn === 'function') { return fn(req, reply); }
    reply.code(401).send({ error: 'Auth required' });
  });

  app.get('/', async (req: any) => {
    const { rows } = await req.pg.query(
      `select user_id, min_vote, preferred_genres, preferred_people, preferred_cinemas, exclude_genres
         from public.user_preferences
        where user_id = $1`,
      [req.user.id]
    );
    return rows[0] || { user_id: req.user.id, min_vote: 6.5, preferred_genres: [], preferred_people: [], preferred_cinemas: [], exclude_genres: [] };
  });

  app.post('/', async (req: any) => {
    const data = schema.parse(req.body);
    await req.pg.query(
      `insert into public.user_preferences (user_id, min_vote, preferred_genres, preferred_people, preferred_cinemas, exclude_genres)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (user_id) do update set
         min_vote = excluded.min_vote,
         preferred_genres = excluded.preferred_genres,
         preferred_people = excluded.preferred_people,
         preferred_cinemas = excluded.preferred_cinemas,
         exclude_genres = excluded.exclude_genres`,
      [req.user.id, data.min_vote, data.preferred_genres, data.preferred_people, data.preferred_cinemas, data.exclude_genres]
    );
    return { ok: true };
  });
};

export default plugin;
