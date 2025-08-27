import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { supabaseJwt } from './auth/supabaseJwt.js';
import { env } from './env.js';
import { pool } from './db.js';
import cinemas from './routes/cinemas.js';
import preferences from './routes/preferences.js';
import matches from './routes/matches.js';
import push from './routes/push.js';

const app = Fastify({ logger: true });

// CORS: development-wide by default; tighten on prod via env.ALLOWED_ORIGINS (comma-separated)
const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
await app.register(cors, { origin: allowed.length ? allowed : true, credentials: true });

// JWT -> req.user
await app.register(supabaseJwt);

// Allocate per-request pg client so we can set GUC for Supabase RLS and keep it on the same connection.
app.addHook('onRequest', async (req: any) => {
  (req as any).pg = await pool.connect();
});
app.addHook('preHandler', async (req: any) => {
  const c = (req as any).pg;
  if (c && req.user?.id) {
    // Pass user id to Postgres RLS policies that rely on auth.uid()
    await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: req.user.id })]);
  }
});
const release = async (req: any) => { try { (req as any).pg?.release?.(); } catch {} };
app.addHook('onResponse', release);
app.addHook('onError', release);

app.get('/api/health', async () => ({ ok: true }));

app.register(cinemas, { prefix: '/api/cinemas' });
app.register(preferences, { prefix: '/api/preferences' });
app.register(matches, { prefix: '/api/matches' });
app.register(push, { prefix: '/api/push' });

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  app.log.info(`API running on http://localhost:${env.PORT}`);
});
