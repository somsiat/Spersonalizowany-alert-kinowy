import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pool } from '../db';

const SubSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

const routes: FastifyPluginAsync = async (app) => {
  app.post('/push/subscribe', async (req: any, reply) => {
    const userId: string | undefined = req.user?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const parsed = SubSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    // zapisujemy w subscriptions jako JSON + channel=webpush
    await pool.query(
      `
      insert into public.subscriptions (user_id, channel, endpoint, is_active)
      values ($1, 'webpush', $2::jsonb, true)
      on conflict do nothing
      `,
      [userId, JSON.stringify(parsed.data)]
    );

    return reply.send({ ok: true });
  });
};

export default routes;
