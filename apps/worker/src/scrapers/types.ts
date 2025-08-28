// apps/worker/src/scrapers/types.ts

export type RawShowtime = {
  /** ID kina przekazywany przez worker do scrapera – może być number/string/bigint */
  cinemaId: number | string | bigint;

  /** Surowy tytuł filmu, jak na stronie kina */
  movieTitleRaw: string;

  /** Data/godzina seansu */
  startsAt: Date | string;

  /** Opcjonalne metadane */
  lang?: string | null;
  format?: string | null;
  price?: number | null;

  /** Pola obecne w Twoim schemacie showtimes – opcjonalne w scraperach */
  version?: string | null;
  auditorium?: string | null;
  externalUrl?: string | null;
};

export type CinemaScraper = {
  /**
   * Zwraca listę seansów w zakresie dat.
   * UWAGA: `cinemaId` dostajesz od workera (Number(c.id)), możesz go tylko przepchnąć do wyniku.
   */
  fetchShowtimes(
    url: string,
    from: Date,
    to: Date,
    cinemaId: number | string
  ): Promise<RawShowtime[]>;
};
