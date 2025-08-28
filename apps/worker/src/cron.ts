// apps/worker/src/cron.ts
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });

import cron from 'node-cron';
import { runScrapeAndIngest } from './index';

const CRON = process.env.CRON_EXPR_SCRAPE ?? '*/30 * * * *';
const TIMEZONE = process.env.TZ ?? 'Europe/Warsaw';

console.log(`[cron] scheduling "${CRON}" (${TIMEZONE})`);
cron.schedule(CRON, async () => {
  console.log('[cron] tick: scrape start');
  try {
    await runScrapeAndIngest();
    console.log('[cron] scrape ok');
  } catch (e) {
    console.error('[cron] scrape fail:', e);
  }
}, { timezone: TIMEZONE });

console.log('[cron] worker started');
