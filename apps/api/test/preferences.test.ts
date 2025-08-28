import Fastify from 'fastify';
import cors from '@fastify/cors';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import preferences from '../src/routes/preferences';
import { pool } from '../src/db';

const USER = { id: '00000000-0000-0000-0000-000000000124' };
const auth = `Bearer x.${Buffer.from(JSON.stringify({ sub: USER.id })).toString('base64url')}.y`;

describe('/api/preferences (mapuje user_prefs)', () => {
  const app = Fastify();

  beforeAll(async () => {
    await app.register(cors, { origin: true });
    await app.register(preferences, { prefix: '/api' });
  });
  afterAll(async () => { await app.close(); });

  it('POST/GET cykl', async () => {
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/preferences',
      headers: { authorization: auth },
      payload: { min_vote: 6.5, preferred_cinemas: [1, 2] }
    });
    expect(postRes.statusCode).toBe(200);

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/preferences',
      headers: { authorization: auth },
    });
    expect(getRes.statusCode).toBe(200);
    const body = getRes.json() as any;
    expect(body.min_vote).toBe(6.5);
    expect(body.preferred_cinemas).toEqual(['1','2']);
  });
});
