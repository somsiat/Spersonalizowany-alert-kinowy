import { supabaseAdmin } from './supabase'
import { UserPreferences } from './auth'

export interface MovieMatch {
  movie_id: number    // integer w bazie
  showtime_id: number // integer w bazie
  match_score: number
  reasons: string[]
}

// Algorytm dopasowywania filmów do preferencji użytkownika
export function calculateMatchScore(
  movie: any,
  preferences: UserPreferences
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Sprawdź ocenę IMDb
  if (movie.imdb_rating && movie.imdb_rating >= (preferences.min_imdb || 0)) {
    score += 0.3
    reasons.push(`Ocena IMDb: ${movie.imdb_rating}/10`)
  }

  // Sprawdź gatunki
  if (movie.genre && preferences.genres && preferences.genres.length > 0) {
    const movieGenres = movie.genre.split(',').map((g: string) => g.trim())
    const matchingGenres = movieGenres.filter((genre: string) =>
      preferences.genres?.some(prefGenre =>
        genre.toLowerCase().includes(prefGenre.toLowerCase())
      )
    )
    
    if (matchingGenres.length > 0) {
      score += 0.3 * (matchingGenres.length / movieGenres.length)
      reasons.push(`Gatunki: ${matchingGenres.join(', ')}`)
    }
  }

  // Sprawdź ludzi (reżyserzy i aktorzy)
  if (movie.director && preferences.people && preferences.people.length > 0) {
    const matchingPeople = preferences.people.filter(person =>
      movie.director.toLowerCase().includes(person.toLowerCase())
    )
    
    if (matchingPeople.length > 0) {
      score += 0.2
      reasons.push(`Reżyser: ${matchingPeople.join(', ')}`)
    }
  }

  // Sprawdź aktorów
  if (movie.actors && preferences.people && preferences.people.length > 0) {
    const matchingActors = preferences.people.filter(person =>
      movie.actors.toLowerCase().includes(person.toLowerCase())
    )
    
    if (matchingActors.length > 0) {
      score += 0.1 * matchingActors.length
      reasons.push(`Aktorzy: ${matchingActors.join(', ')}`)
    }
  }

  return { score: Math.min(score, 1.0), reasons }
}

// Funkcja do znajdowania dopasowań dla użytkownika
export async function findMatchesForUser(userId: string): Promise<MovieMatch[]> {
  try {
    if (!supabaseAdmin) {
      console.error('supabaseAdmin is not available')
      return []
    }

    // Pobierz preferencje użytkownika
    const { data: preferences } = await supabaseAdmin
      .from('user_prefs')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!preferences) {
      console.log('No preferences found for user:', userId)
      return []
    }

    // Pobierz wszystkie kina (Twoja tabela nie ma pola is_active)
    const { data: cinemas } = await supabaseAdmin
      .from('cinemas')
      .select('id')

    if (!cinemas || cinemas.length === 0) {
      console.log('No cinemas found')
      return []
    }

    const cinemaIds = cinemas.map(c => c.id)

    // Pobierz seanse z ulubionych kin
    const { data: showtimes } = await supabaseAdmin
      .from('showtimes')
      .select(`
        id,
        movie_id,
        cinema_id,
        show_date,
        show_time,
        movies (
          id,
          title,
          imdb_rating,
          genre,
          director,
          actors
        )
      `)
      .in('cinema_id', cinemaIds)
      .gte('show_date', new Date().toISOString().split('T')[0])
      .order('show_date')
      .order('show_time')

    if (!showtimes || showtimes.length === 0) {
      console.log('No showtimes found')
      return []
    }

    const matches: MovieMatch[] = []

    for (const showtime of showtimes) {
      if (!showtime.movies) continue

      // Sprawdź czy użytkownik ma ulubione kina
      if (preferences.favorite_cinemas && preferences.favorite_cinemas.length > 0) {
        if (!preferences.favorite_cinemas.includes(showtime.cinema_id)) {
          continue
        }
      }

      // Oblicz wynik dopasowania
      const { score, reasons } = calculateMatchScore(showtime.movies, preferences)

      // Dodaj dopasowanie jeśli wynik jest wystarczająco wysoki
      if (score >= 0.3) { // Minimum 30% dopasowania
        matches.push({
          movie_id: showtime.movie_id,
          showtime_id: showtime.id,
          match_score: score,
          reasons
        })
      }
    }

    // Sortuj według wyniku dopasowania
    matches.sort((a, b) => b.match_score - a.match_score)

    return matches
  } catch (error) {
    console.error('Error finding matches for user:', error)
    return []
  }
}

// Funkcja do zapisywania dopasowań w bazie danych
export async function saveMatchesForUser(userId: string): Promise<void> {
  try {
    if (!supabaseAdmin) {
      console.error('supabaseAdmin is not available')
      return
    }

    const matches = await findMatchesForUser(userId)

    for (const match of matches) {
      // Sprawdź czy dopasowanie już istnieje
      const { data: existingMatch } = await supabaseAdmin
        .from('user_matches')
        .select('id')
        .eq('user_id', userId)
        .eq('movie_id', match.movie_id)
        .eq('showtime_id', match.showtime_id)
        .single()

      if (!existingMatch) {
        // Dodaj nowe dopasowanie
        await supabaseAdmin
          .from('user_matches')
          .insert({
            user_id: userId,
            movie_id: match.movie_id,
            showtime_id: match.showtime_id,
            match_score: match.match_score,
          })
      }
    }

    console.log(`Saved ${matches.length} matches for user ${userId}`)
  } catch (error) {
    console.error('Error saving matches for user:', error)
  }
}

// Funkcja do uruchamiania dopasowywania dla wszystkich użytkowników
export async function runMatchingForAllUsers(): Promise<void> {
  try {
    if (!supabaseAdmin) {
      console.error('supabaseAdmin is not available')
      return
    }

    const { data: users } = await supabaseAdmin
      .from('user_prefs')
      .select('user_id')

    if (!users) {
      console.log('No users with preferences found')
      return
    }

    for (const user of users) {
      await saveMatchesForUser(user.user_id)
    }

    console.log(`Processed matching for ${users.length} users`)
  } catch (error) {
    console.error('Error running matching for all users:', error)
  }
}
