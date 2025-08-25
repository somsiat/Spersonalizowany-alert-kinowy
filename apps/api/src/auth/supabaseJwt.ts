
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '../env.js';

export const supabaseJwt: FastifyPluginAsync = async (app) => {
  const JWKS = env.SUPABASE_JWKS_URL ? createRemoteJWKSet(new URL(env.SUPABASE_JWKS_URL)) : null;
  app.decorate('authenticate', async (req: any, reply: any) => {
    const auth = req.headers.authorization;
    if (!auth) {
      if (env.DEV_ALLOW_ANON) { req.user = { id: env.DEV_USER_ID }; return; }
      return reply.code(401).send({ error: 'No token' });
    }
    try {
      const token = auth.replace('Bearer ', '');
      if (!JWKS) throw new Error('JWKS url not configured');
      const { payload } = await jwtVerify(token, JWKS);
      req.user = { id: payload.sub };
    } catch (e: any) {
      reply.code(401).send({ error: 'Invalid token', details: e.message });
    }
  });
};
