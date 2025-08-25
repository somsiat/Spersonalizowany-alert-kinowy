
export type UserPrefs = {
  min_vote: number;
  preferred_genres: string[];
  exclude_genres: string[];
  preferred_people: string[];
};

export type MovieMeta = {
  tmdb_vote_average?: number;
  genres?: string[];
  cast?: string[];
  directors?: string[];
};

export function scoreMovie(p: UserPrefs, m: MovieMeta) {
  let score = 0;
  if (m.tmdb_vote_average && m.tmdb_vote_average >= p.min_vote) score += 2;
  if (m.genres?.length) {
    const hit = m.genres.filter(g => p.preferred_genres.includes(g)).length;
    score += hit * 1.5;
    const bad = m.genres.filter(g => p.exclude_genres.includes(g)).length;
    score -= bad * 2;
  }
  const people = [...(m.cast || []), ...(m.directors || [])];
  if (people.length) {
    const liked = people.filter(x => p.preferred_people.includes(x)).length;
    if (liked) score += 2 + liked * 0.5;
  }
  return score;
}
