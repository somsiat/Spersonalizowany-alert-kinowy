import * as cheerio from 'cheerio';
import { chromium } from 'playwright';
import type { CinemaScraper, RawShowtime } from './types';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export const HeliosScraper: CinemaScraper = {
  key: 'helios',
  async fetchShowtimes(url, from, to, cinemaId) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
      locale: 'pl-PL'
    });
    page.setDefaultTimeout(15000);

    try {
      await page.route('**/*', (route) => {
        const req = route.request();
        // block heavy assets
        if (['image', 'font', 'media'].includes(req.resourceType())) return route.abort();
        route.continue();
      });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      // accept cookie banners if present (best-effort)
      try {
        const btn = await page.$('button:has-text("Akceptuj"), button:has-text("Zgadzam się")');
        if (btn) { await btn.click({ timeout: 2000 }); await sleep(300); }
      } catch {}

      const html = await page.content();
      const $ = cheerio.load(html);
      const rows: RawShowtime[] = [];

      // NOTE: Selektory przykładowe – dopasuj do realnego DOM Heliosa
      $('.movie-card, .film, [data-movie]').each((_, el) => {
        const title = $(el).find('.movie-title, .title, [itemprop="name"]').first().text().trim();
        $(el).find('a.showtime, .hour a, a[data-datetime]').each((__, s) => {
          const dt = $(s).attr('data-datetime') || $(s).attr('datetime') || $(s).text();
          const href = $(s).attr('href');
          if (title && dt) {
            const iso = new Date(dt).toISOString();
            const d = new Date(iso);
            if (d >= from && d <= to) {
              rows.push({
                cinemaId,
                movieTitleRaw: title,
                startsAt: iso,
                source: 'helios',
                externalUrl: href ? new URL(href, url).toString() : url
              });
            }
          }
        });
      });
      return rows;
    } finally {
      await browser.close();
    }
  }
};
