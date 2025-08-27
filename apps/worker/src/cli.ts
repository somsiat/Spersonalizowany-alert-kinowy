import { runScrapeAndIngest } from './index';

runScrapeAndIngest()
  .then(() => { console.log('[worker] scrape done'); process.exit(0); })
  .catch((e) => { console.error('[worker] scrape failed:', e); process.exit(1); });
