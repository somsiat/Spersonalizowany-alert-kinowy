import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { supabaseJwt } from './auth/supabaseJwt.js';
import { env } from './env.js';
import cinemas from './routes/cinemas.js';
import preferences from './routes/preferences.js';
import matches from './routes/matches.js';
import push from './routes/push.js';


console.log('[ENV] DB_URL loaded?', !!process.env.DATABASE_URL, (process.env.DATABASE_URL || '').slice(0, 40));



const app = Fastify({ logger: true });
await app.register(cors, { origin: true, credentials: true });
await app.register(supabaseJwt);

app.get('/api/health', async () => ({ ok: true }));

app.register(cinemas, { prefix: '/api/cinemas' });
app.register(preferences, { prefix: '/api/preferences' });
app.register(matches, { prefix: '/api/matches' });
app.register(push, { prefix: '/api/push' });

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  app.log.info(`API running on http://localhost:${env.PORT}`);
});
