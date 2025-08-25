
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pool } from '../db';

const plugin: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', async (req: any, reply: any) => {
  const fn = (app as any).authenticate;
  if (typeof fn === 'function') {
    return fn(req, reply); // normalna autoryzacja Supabase JWT
  }
  // Fallback dla DEV bez JWT (działa, jeśli masz DEV_ALLOW_ANON=true)
  if (process.env.DEV_ALLOW_ANON === 'true') {
    (req as any).user = { id: process.env.DEV_USER_ID || '00000000-0000-0000-0000-000000000001' };
    return;
  }
  reply.code(401).send({ error: 'Auth not configured' });
});

  app.post('/subscribe', async (req: any, reply) => {
    const body = z.any().parse(req.body); // cały obiekt sub z Push API
    await pool.query(
      `insert into public.subscriptions (user_id, channel, endpoint, is_active)
       values ($1, 'webpush', $2::jsonb, true)`,
      [req.user.id, body]
    );
    reply.send({ ok: true });
  });
};

export default plugin;
