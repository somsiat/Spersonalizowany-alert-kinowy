import { supabaseAdmin } from './supabase'

export interface ShowtimeData {
  movie_title: string
  show_date: string
  show_time: string
  hall?: string
  price?: number
  available_seats?: number
}

export interface CinemaScraper {
  name: string
  baseUrl: string
  scrape: () => Promise<ShowtimeData[]>
}

// Scraper dla Helios
export class HeliosScraper implements CinemaScraper {
  name = 'Helios'
  baseUrl = 'https://www.helios.pl'

  async scrape(): Promise<ShowtimeData[]> {
    try {
      // Symulacja scrapingu - w rzeczywistości używałbyś biblioteki jak Puppeteer lub Cheerio
      // Tutaj zwracamy przykładowe dane
      return [
        {
          movie_title: 'Oppenheimer',
          show_date: new Date().toISOString().split('T')[0],
          show_time: '19:30',
          hall: 'Sala 1',
          price: 25.00,
          available_seats: 45
        },
        {
          movie_title: 'Barbie',
          show_date: new Date().toISOString().split('T')[0],
          show_time: '21:00',
          hall: 'Sala 2',
          price: 25.00,
          available_seats: 32
        }
      ]
    } catch (error) {
      console.error('Error scraping Helios:', error)
      return []
    }
  }
}

// Scraper dla Multikino
export class MultikinoScraper implements CinemaScraper {
  name = 'Multikino'
  baseUrl = 'https://www.multikino.pl'

  async scrape(): Promise<ShowtimeData[]> {
    try {
      // Symulacja scrapingu
      return [
        {
          movie_title: 'Fast X',
          show_date: new Date().toISOString().split('T')[0],
          show_time: '18:00',
          hall: 'Sala A',
          price: 28.00,
          available_seats: 67
        },
        {
          movie_title: 'Guardians of the Galaxy Vol. 3',
          show_date: new Date().toISOString().split('T')[0],
          show_time: '20:30',
          hall: 'Sala B',
          price: 28.00,
          available_seats: 23
        }
      ]
    } catch (error) {
      console.error('Error scraping Multikino:', error)
      return []
    }
  }
}

// Scraper dla Cinema City
export class CinemaCityScraper implements CinemaScraper {
  name = 'Cinema City'
  baseUrl = 'https://www.cinema-city.pl'

  async scrape(): Promise<ShowtimeData[]> {
    try {
      // Symulacja scrapingu
      return [
        {
          movie_title: 'Spider-Man: Across the Spider-Verse',
          show_date: new Date().toISOString().split('T')[0],
          show_time: '17:45',
          hall: 'Sala 3',
          price: 26.00,
          available_seats: 89
        },
        {
          movie_title: 'The Little Mermaid',
          show_date: new Date().toISOString().split('T')[0],
          show_time: '19:15',
          hall: 'Sala 4',
          price: 26.00,
          available_seats: 56
        }
      ]
    } catch (error) {
      console.error('Error scraping Cinema City:', error)
      return []
    }
  }
}

// Główna funkcja do scrapingu wszystkich kin
export async function scrapeAllCinemas(): Promise<void> {
  const scrapers = [
    new HeliosScraper(),
    new MultikinoScraper(),
    new CinemaCityScraper()
  ]

  for (const scraper of scrapers) {
    try {
      console.log(`Scraping ${scraper.name}...`)
      const showtimes = await scraper.scrape()
      
      // Pobierz ID kina z bazy danych
      const { data: cinema } = await supabaseAdmin
        .from('cinemas')
        .select('id')
        .ilike('name', `%${scraper.name}%`)
        .single()

      if (!cinema) {
        console.error(`Cinema ${scraper.name} not found in database`)
        continue
      }

      // Przetwórz każdy seans
      for (const showtime of showtimes) {
        // Sprawdź czy film już istnieje w bazie
        let { data: movie } = await supabaseAdmin
          .from('movies')
          .select('id')
          .ilike('title', `%${showtime.movie_title}%`)
          .single()

        // Jeśli film nie istnieje, utwórz go (z podstawowymi danymi)
        if (!movie) {
          const { data: newMovie } = await supabaseAdmin
            .from('movies')
            .insert({
              title: showtime.movie_title,
              imdb_id: `temp_${Date.now()}`, // Tymczasowy ID
            })
            .select()
            .single()
          
          movie = newMovie
        }

        if (movie) {
          // Sprawdź czy seans już istnieje
          const { data: existingShowtime } = await supabaseAdmin
            .from('showtimes')
            .select('id')
            .eq('cinema_id', cinema.id)
            .eq('movie_id', movie.id)
            .eq('show_date', showtime.show_date)
            .eq('show_time', showtime.show_time)
            .single()

          if (!existingShowtime) {
            // Dodaj nowy seans
            await supabaseAdmin
              .from('showtimes')
              .insert({
                cinema_id: cinema.id,
                movie_id: movie.id,
                show_date: showtime.show_date,
                show_time: showtime.show_time,
                hall: showtime.hall,
                price: showtime.price,
                available_seats: showtime.available_seats,
              })
          }
        }
      }

      console.log(`Successfully scraped ${showtimes.length} showtimes from ${scraper.name}`)
    } catch (error) {
      console.error(`Error scraping ${scraper.name}:`, error)
    }
  }
}

// Funkcja do uruchamiania scrapingu przez API
export async function runScraping(): Promise<{ success: boolean; message: string }> {
  try {
    await scrapeAllCinemas()
    return { success: true, message: 'Scraping completed successfully' }
  } catch (error) {
    console.error('Error in runScraping:', error)
    return { success: false, message: 'Scraping failed' }
  }
}
