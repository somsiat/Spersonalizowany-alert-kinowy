import dns from 'node:dns';
import { Pool } from 'pg';

dns.setDefaultResultOrder?.('verbatim');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: Number(process.env.PGPOOL_MAX ?? 10),
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  console.error('[pg] pool error', err);
});
