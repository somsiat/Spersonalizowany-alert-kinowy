import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const SubSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
});

const plugin: FastifyPluginAsync = async (app) => {
  // Require auth
  app.addHook('preHandler', async (req: any, reply: any) => {
    const fn = (app as any).authenticate;
    if (typeof fn === 'function') { return fn(req, reply); }
    reply.code(401).send({ error: 'Auth required' });
  });

  app.post('/subscribe', async (req: any) => {
    const sub = SubSchema.parse(req.body);
    await req.pg.query(
      `insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
       values ($1,$2,$3,$4)
       on conflict (user_id, endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth`,
      [req.user.id, sub.endpoint, sub.keys.p256dh, sub.keys.auth]
    );
    return { ok: true };
  });
};

export default plugin;
