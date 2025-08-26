
import cron from 'node-cron';
import { runScrapeAndIngest } from './index';
import 'dotenv/config';


const expr = process.env.CRON_EXPR_SCRAPE || '*/30 * * * *';
console.log('[worker] starting cron:', expr);

cron.schedule(expr, async () => {
  console.log('[worker] tick at', new Date().toISOString());
  try {
    await runScrapeAndIngest();
    console.log('[worker] run complete');
  } catch (e) {
    console.error('[worker] error', e);
  }
});

// run once on start in dev
if (process.env.NODE_ENV !== 'production') {
  runScrapeAndIngest().catch(console.error);
}
