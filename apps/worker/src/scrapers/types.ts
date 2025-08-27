export type RawShowtime = {
  cinemaId: string;       // uuid from DB
  movieTitleRaw: string;
  startsAt: string;       // ISO
  lang?: string;
  format?: string;
  price?: number;
  externalUrl?: string;
  source: string;         // 'helios' | 'multikino' | 'cinema_city' | 'manual'
};

export interface CinemaScraper {
  key: string; // e.g. 'helios'
  fetchShowtimes(cinemaUrl: string, from: Date, to: Date, cinemaId: string): Promise<RawShowtime[]>;
}
