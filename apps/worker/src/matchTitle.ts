// apps/worker/src/matchTitle.ts
import stringSimilarity from 'string-similarity';

export type MovieLike = {
  id: number;
  title: string;
  original_title?: string;
  release_date?: string | null;
};

export function bestTitleMatch(
  query: string,
  candidates: MovieLike[],
  opts: { year?: number; threshold?: number } = {}
): MovieLike | null {
  const threshold = opts.threshold ?? 0.55;
  const q = norm(query);

  let best: { item: MovieLike; score: number } | null = null;

  for (const c of candidates) {
    const titles = [c.title, c.original_title].filter(Boolean) as string[];
    let score = 0;
    for (const t of titles) {
      const s = stringSimilarity.compareTwoStrings(q, norm(t));
      if (s > score) score = s;
    }
    if (opts.year && yearOf(c.release_date) === opts.year) score += 0.05;
    if (!best || score > best.score) best = { item: c, score };
  }
  return best && best.score >= threshold ? best.item : null;
}

function norm(s: string): string {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function yearOf(date?: string | null): number | null {
  if (!date) return null;
  const m = /^(\d{4})/.exec(date);
  return m ? Number(m[1]) : null;
}
