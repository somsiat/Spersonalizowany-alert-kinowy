import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { pool } from './db';
import matches from './routes/matches';
import preferences from './routes/preferences';
import push from './routes/push';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') ?? true,
  credentials: true,
});

// Minimalne rozpoznanie usera z JWT (bez weryfikacji) – prod: JOSE + JWKS
app.addHook('onRequest', async (req: any) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
      req.user = { id: payload.sub };
    } catch {}
  }
});

// Ustaw GUC (RLS-friendly)
app.addHook('preHandler', async (req: any) => {
  if (req.user?.id) {
    await pool.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: req.user.id }),
    ]);
  }
});

app.get('/api/health', async () => ({ ok: true }));

await app.register(matches, { prefix: '/api' });
await app.register(preferences, { prefix: '/api' });
await app.register(push, { prefix: '/api' });

const port = Number(process.env.PORT ?? 3001);
app.listen({ host: '0.0.0.0', port }).then(() => {
  app.log.info(`API running on http://localhost:${port}`);
});
