
import stringSimilarity from 'string-similarity';

export function bestTitleMatch(query: string, candidates: any[]) {
  if (!candidates?.length) return null;
  const scored = candidates.map(r => {
    const s = Math.max(
      stringSimilarity.compareTwoStrings(query.toLowerCase(), (r.title || '').toLowerCase()),
      stringSimilarity.compareTwoStrings(query.toLowerCase(), (r.original_title || '').toLowerCase())
    );
    return { r, s };
  }).sort((a,b) => b.s - a.s || (b.r.popularity || 0) - (a.r.popularity || 0));
  return scored[0].r;
}
