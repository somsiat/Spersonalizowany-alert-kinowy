'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface MovieMatch {
  id: number        // integer w bazie
  match_score: number
  movies: {
    title: string
    poster_url: string
    imdb_rating: number
    genre: string
    director: string
    actors: string
  }
  showtimes: {
    show_date: string
    show_time: string
    hall: string
    price: number
    available_seats: number
  }
  cinemas: {
    name: string
    city: string
    address: string
  }
}

interface MovieMatchesProps {
  userId: string
}

export default function MovieMatches({ userId }: MovieMatchesProps) {
  const [matches, setMatches] = useState<MovieMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notifyMessage, setNotifyMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    fetchMatches()
  }, [userId])

  const fetchMatches = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Nie jesteś zalogowany')
        return
      }

      const response = await fetch('/api/matches', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Nie udało się pobrać dopasowań')
      }

      const data = await response.json()
      setMatches(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL')
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  const handleNotifyMatch = async (match: MovieMatch) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setNotifyMessage({type: 'error', text: 'Nie jesteś zalogowany'})
        return
      }

      console.log('🔔 Creating notification for match:', match.movies.title)

      // Przygotuj dane filmu do zapisania
      const movieData = {
        movie_id: match.movies.id || null,
        showtime_id: match.showtimes.id || null,
        alert_type: 'new_showtime',
        movie_title: match.movies.title,
        movie_year: null, // Można dodać jeśli dostępne
        movie_genre: match.movies.genre,
        movie_director: match.movies.director,
        movie_actors: match.movies.actors,
        movie_imdb_rating: match.movies.imdb_rating,
        movie_poster_url: match.movies.poster_url,
        movie_plot: null, // Można dodać jeśli dostępne
        movie_rated: null, // Można dodać jeśli dostępne
        movie_runtime: null // Można dodać jeśli dostępne
      }

      // Utwórz alert dla dopasowania
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(movieData)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Notification created:', data)
        
        // Wyślij powiadomienia zgodnie z preferencjami użytkownika
        await sendNotificationsForMatch(movieData, session.access_token)
        
        setNotifyMessage({type: 'success', text: `Powiadomienie o filmie "${match.movies.title}" zostało utworzone!`})
        
        // Ukryj komunikat po 3 sekundach
        setTimeout(() => {
          setNotifyMessage(null)
        }, 3000)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error creating notification:', errorData)
        setNotifyMessage({type: 'error', text: `Błąd: ${errorData.error || 'Nie udało się utworzyć powiadomienia'}`})
        
        // Ukryj komunikat po 3 sekundach
        setTimeout(() => {
          setNotifyMessage(null)
        }, 3000)
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      setNotifyMessage({type: 'error', text: 'Błąd połączenia'})
      
      // Ukryj komunikat po 3 sekundach
      setTimeout(() => {
        setNotifyMessage(null)
      }, 3000)
    }
  }

  const sendNotificationsForMatch = async (movieData: any, accessToken: string) => {
    try {
      // Pobierz preferencje użytkownika
      const prefsResponse = await fetch('/api/prefs', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (prefsResponse.ok) {
        const preferences = await prefsResponse.json()
        
        // Wyślij powiadomienia zgodnie z preferencjami
        if (preferences.email_notifications || preferences.push_notifications) {
          const notificationData = {
            userId: userId,
            movieTitle: movieData.movie_title,
            movieYear: movieData.movie_year,
            movieGenre: movieData.movie_genre,
            movieDirector: movieData.movie_director,
            movieImdbRating: movieData.movie_imdb_rating,
            moviePosterUrl: movieData.movie_poster_url,
            moviePlot: movieData.movie_plot,
            alertType: 'new_showtime'
          }

          // Wyślij powiadomienia
          await fetch('/api/send-notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              ...notificationData,
              emailEnabled: preferences.email_notifications,
              pushEnabled: preferences.push_notifications
            })
          })
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">Ładowanie dopasowań...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Filmy dla Ciebie</h2>
      
      {/* Komunikat o powiadomieniach */}
      {notifyMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          notifyMessage.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {notifyMessage.type === 'success' ? '✅' : '❌'}
            </span>
            <span>{notifyMessage.text}</span>
          </div>
        </div>
      )}
      
      {matches.length === 0 ? (
        <div className="text-center text-black py-8">
          Brak dopasowań. Sprawdź swoje preferencje lub poczekaj na nowe seanse.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                {match.movies.poster_url && match.movies.poster_url !== 'N/A' && (
                  <img
                    src={match.movies.poster_url}
                    alt={match.movies.title}
                    className="w-full h-64 object-cover"
                  />
                )}
                
                {/* Przycisk powiadomienia */}
                <button
                  onClick={() => handleNotifyMatch(match)}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 hover:text-indigo-600 p-2 rounded-full shadow-md transition-colors"
                  title="Powiadom o tym filmie"
                >
                  🔔
                </button>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{match.movies.title}</h3>
                
                <div className="space-y-2 text-sm text-black">
                  <div>
                    <span className="font-medium">Ocena IMDb:</span> {match.movies.imdb_rating}/10
                  </div>
                  <div>
                    <span className="font-medium">Gatunek:</span> {match.movies.genre}
                  </div>
                  <div>
                    <span className="font-medium">Reżyser:</span> {match.movies.director}
                  </div>
                  <div>
                    <span className="font-medium">Aktorzy:</span> {match.movies.actors}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <div className="text-sm">
                    <div className="font-medium text-indigo-600">{match.cinemas.name}</div>
                    <div className="text-black">{match.cinemas.city}</div>
                    <div className="text-black">{match.cinemas.address}</div>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <div>
                      <span className="font-medium">Data:</span> {formatDate(match.showtimes.show_date)}
                    </div>
                    <div>
                      <span className="font-medium">Godzina:</span> {formatTime(match.showtimes.show_time)}
                    </div>
                    {match.showtimes.hall && (
                      <div>
                        <span className="font-medium">Sala:</span> {match.showtimes.hall}
                      </div>
                    )}
                    {match.showtimes.price && (
                      <div>
                        <span className="font-medium">Cena:</span> {match.showtimes.price} zł
                      </div>
                    )}
                    {match.showtimes.available_seats && (
                      <div>
                        <span className="font-medium">Wolne miejsca:</span> {match.showtimes.available_seats}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <div className="text-sm">
                    <span className="font-medium">Dopasowanie:</span>
                    <span className="ml-1 text-indigo-600 font-semibold">
                      {Math.round(match.match_score * 100)}%
                    </span>
                  </div>
                  
                  <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">
                    Zarezerwuj
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
