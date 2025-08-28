import Fastify from 'fastify';
import cors from '@fastify/cors';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import matches from '../src/routes/matches';
import { pool } from '../src/db';

const USER = { id: '00000000-0000-0000-0000-000000000555' };
const auth = `Bearer x.${Buffer.from(JSON.stringify({ sub: USER.id })).toString('base64url')}.y`;

describe('/api/matches (starts_at + movie_id)', () => {
  const app = Fastify();

  beforeAll(async () => {
    await app.register(cors, { origin: true });
    await app.register(matches, { prefix: '/api' });

    await pool.query(`
      insert into public.cinemas (id, name, city, url, is_active)
      values (1001, 'Helios', 'Miasto', 'https://example.com/helios', true)
      on conflict (id) do nothing;

      insert into public.movies (id, tmdb_id, title, tmdb_rating)
      values (2001, 999999, 'Interstellar', 8.6)
      on conflict (id) do nothing;

      -- 3 seanse jutro, pojutrze, dziś+3h
      delete from public.showtimes where cinema_id=1001;
      insert into public.showtimes (cinema_id, movie_id, starts_at, source)
      values
        (1001, 2001, now() + interval '1 hour', 'helios'),
        (1001, 2001, now() + interval '1 day', 'helios'),
        (1001, 2001, now() + interval '2 day', 'helios');

      insert into public.user_prefs (user_id, min_imdb, favorite_cinemas)
      values ('${USER.id}', 0, array[1001])
      on conflict (user_id) do update set min_imdb=0, favorite_cinemas=excluded.favorite_cinemas;
    `);
  });

  afterAll(async () => { await app.close(); });

  it('zwraca rosnąco po starts_at', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/matches?limit=10',
      headers: { authorization: auth },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    const times = body.items.map((x: any) => +new Date(x.starts_at));
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
  });
});
