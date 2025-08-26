import 'dotenv/config';
import dns from 'node:dns';
dns.setDefaultResultOrder('verbatim'); // pozwól Node korzystać z IPv6, jeśli tylko AAAA jest dostępny

import { Pool } from 'pg';
import { env } from './env';

const isSupabase = !!env.DATABASE_URL && env.DATABASE_URL.includes('supabase.co');

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
});

