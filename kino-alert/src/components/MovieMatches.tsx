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
      <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-white text-center">
        🎯 Filmy dla Ciebie
      </h2>
      
      {/* Komunikat o powiadomieniach */}
      {notifyMessage && (
        <div className={`mb-6 p-4 rounded-lg backdrop-blur-xl border ${
          notifyMessage.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
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
        <div className="text-center text-gray-300 py-12">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-lg">Brak dopasowań. Sprawdź swoje preferencje lub poczekaj na nowe seanse.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <div key={match.id} className="card-movie overflow-hidden">
              <div className="relative h-80 overflow-hidden rounded-t-2xl">
                {match.movies.poster_url && match.movies.poster_url !== 'N/A' ? (
                  <img
                    src={match.movies.poster_url}
                    alt={match.movies.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-6xl mb-4 opacity-50">🎬</div>
                    <span className="text-sm font-medium text-center px-4 text-gray-300">
                      {match.movies.title}
                    </span>
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                
                {/* Przycisk powiadomienia */}
                <button
                  onClick={() => handleNotifyMatch(match)}
                  className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm border-2 border-white/50 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:border-yellow-500 hover:text-yellow-500 hover:bg-yellow-500/20"
                  title="Powiadom o tym filmie"
                >
                  <span className="text-lg">🔔</span>
                </button>
              </div>
              
              <div className="p-5 sm:p-6 bg-gray-900/50 backdrop-blur-sm">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">{match.movies.title}</h3>
                
                <div className="space-y-2 text-sm text-gray-200 mb-4">
                  <div>
                    <span className="font-semibold text-white">Ocena IMDb:</span> 
                    <span className="ml-2 text-yellow-400 font-bold">{match.movies.imdb_rating}/10</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white">Gatunek:</span> 
                    <span className="ml-2 text-gray-300">{match.movies.genre}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white">Reżyser:</span> 
                    <span className="ml-2 text-gray-300">{match.movies.director}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white">Aktorzy:</span> 
                    <span className="ml-2 text-gray-300">{match.movies.actors}</span>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-800/70 rounded-lg border border-gray-700/50">
                  <div className="text-sm mb-3">
                    <div className="font-bold text-blue-400 text-base">{match.cinemas.name}</div>
                    <div className="text-white font-medium">{match.cinemas.city}</div>
                    <div className="text-gray-300">{match.cinemas.address}</div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-white">Data:</span> 
                      <span className="ml-2 text-gray-300">{formatDate(match.showtimes.show_date)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-white">Godzina:</span> 
                      <span className="ml-2 text-yellow-400 font-bold text-lg">{formatTime(match.showtimes.show_time)}</span>
                    </div>
                    {match.showtimes.hall && (
                      <div>
                        <span className="font-semibold text-white">Sala:</span> 
                        <span className="ml-2 text-gray-300">{match.showtimes.hall}</span>
                      </div>
                    )}
                    {match.showtimes.price && (
                      <div>
                        <span className="font-semibold text-white">Cena:</span> 
                        <span className="ml-2 text-green-400 font-bold">{match.showtimes.price} zł</span>
                      </div>
                    )}
                    {match.showtimes.available_seats && (
                      <div>
                        <span className="font-semibold text-white">Wolne miejsca:</span> 
                        <span className="ml-2 text-blue-400 font-bold">{match.showtimes.available_seats}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm">
                    <span className="font-semibold text-white">Dopasowanie:</span>
                    <span className="ml-2 text-green-400 font-bold text-lg">
                      {Math.round(match.match_score * 100)}%
                    </span>
                  </div>
                  
                  <button className="btn btn-primary text-sm py-2 px-4">
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
