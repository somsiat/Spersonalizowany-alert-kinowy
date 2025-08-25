
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';
import { CinemaScraper, RawShowtime } from './types';

export const HeliosScraper: CinemaScraper = {
  key: 'helios',
  async fetchShowtimes(url, from, to, cinemaId) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    const rows: RawShowtime[] = [];

    // TODO: dostosuj selektory do Helios
    $('.movie-card').each((_, el) => {
      const title = $(el).find('.movie-title').text().trim();
      $(el).find('.showtime').each((__, s) => {
        const dt = $(s).attr('data-datetime');
        const href = $(s).attr('href');
        if (title && dt) rows.push({
          cinemaId,
          movieTitleRaw: title,
          startsAt: new Date(dt).toISOString(),
          source: 'helios',
          externalUrl: href ? new URL(href, url).toString() : url
        });
      });
    });

    return rows.filter(r => new Date(r.startsAt) >= from && new Date(r.startsAt) <= to);
  }
};
