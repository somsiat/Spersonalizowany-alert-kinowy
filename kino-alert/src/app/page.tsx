'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, UserPreferences } from '@/lib/auth'
import AuthForm from '@/components/AuthForm'
import PreferencesForm from '@/components/PreferencesForm'
import MovieMatches from '@/components/MovieMatches'
import AlertHistory from '@/components/AlertHistory'

// Funkcja do tłumaczenia gatunków na polski
const translateGenre = (genre: string): string => {
  const translations: { [key: string]: string } = {
    'Action': 'Akcja',
    'Adventure': 'Przygoda',
    'Animation': 'Animacja',
    'Biography': 'Biografia',
    'Comedy': 'Komedia',
    'Crime': 'Kryminał',
    'Documentary': 'Dokument',
    'Drama': 'Dramat',
    'Family': 'Rodzinny',
    'Fantasy': 'Fantasy',
    'History': 'Historia',
    'Horror': 'Horror',
    'Music': 'Muzyczny',
    'Musical': 'Musical',
    'Mystery': 'Mystery',
    'Romance': 'Romans',
    'Sci-Fi': 'Science Fiction',
    'Science Fiction': 'Science Fiction',
    'Sport': 'Sportowy',
    'Thriller': 'Thriller',
    'War': 'Wojenny',
    'Western': 'Western'
  }
  
  return genre.split(', ').map(g => translations[g.trim()] || g.trim()).join(', ')
}

// Funkcja do tłumaczenia tytułów filmów na polski
const translateTitle = (title: string): string => {
  const translations: { [key: string]: string } = {
    'Oppenheimer': 'Oppenheimer',
    'Barbie': 'Barbie',
    'Fast X': 'Szybcy i wściekli X',
    'Spider-Man: Across the Spider-Verse': 'Spider-Man: Poprzez multiwersum',
    'The Batman': 'Batman',
    'Spider-Man: No Way Home': 'Spider-Man: Bez drogi do domu',
    'Doctor Strange in the Multiverse of Madness': 'Doktor Strange w multiwersum obłędu',
    'Guardians of the Galaxy Vol. 3': 'Strażnicy Galaktyki: Volume 3',
    'John Wick: Chapter 4': 'John Wick: Rozdział 4',
    'The Little Mermaid': 'Mała Syrenka',
    'The Super Mario Bros. Movie': 'Film Super Mario Bros.',
    'Lightyear': 'Buzz Astral',
    'Thor: Love and Thunder': 'Thor: Miłość i grom',
    'The Matrix Resurrections': 'Matrix: Zmartwychwstania',
    'Eternals': 'Wieczni',
    'Shang-Chi and the Legend of the Ten Rings': 'Shang-Chi i legenda dziesięciu pierścieni',
    'Dune': 'Diuna',
    'Black Widow': 'Czarna Wdowa',
    'Avengers: Endgame': 'Avengers: Koniec gry'
  }
  
  return translations[title] || title
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'matches' | 'all-movies' | 'preferences' | 'alerts'>('all-movies')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [movies, setMovies] = useState<any[]>([])
  const [filteredMovies, setFilteredMovies] = useState<any[]>([])
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedCinema, setSelectedCinema] = useState('all')
  const [moviesLoading, setMoviesLoading] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<any>(null)
  const [showMovieModal, setShowMovieModal] = useState(false)
  const [movieDetails, setMovieDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [movieAlerts, setMovieAlerts] = useState<Set<string>>(new Set())
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await Promise.allSettled([
          checkUser(),
          loadMovies()
        ])
      } catch (error) {
        console.error('Error initializing app:', error)
      }
    }
    
    initializeApp()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        try {
          if (session?.user?.id) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
            })
            fetchPreferences(session.user.id)
            loadMovieAlerts(session.user.id)
          } else {
            setUser(null)
            setPreferences(null)
            setMovieAlerts(new Set())
          }
        } catch (error) {
          console.error('Error in auth state change:', error)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Filtrowanie filmów
  useEffect(() => {
    let filtered = movies

    if (selectedGenre !== 'all') {
      filtered = filtered.filter(movie => {
        const genre = movie.genre || movie.Genre || ''
        return genre.toLowerCase().includes(selectedGenre.toLowerCase())
      })
    }

    if (selectedCinema !== 'all') {
      filtered = filtered.filter(movie => 
        movie.showtimes?.some((showtime: any) => 
          showtime.cinema?.toLowerCase().includes(selectedCinema.toLowerCase())
        )
      )
    }

    setFilteredMovies(filtered)
  }, [movies, selectedGenre, selectedCinema])

  const loadMovies = async () => {
    console.log('🎬 Starting to load movies...')
    setMoviesLoading(true)
    try {
      console.log('🎬 Loading movies from database...')
      await loadMoviesFromDatabase()
      console.log('🎬 Movies loaded successfully!')
    } catch (error) {
      console.error('❌ Error loading movies:', error)
      // Fallback do hardcoded movies jeśli baza nie działa
      console.log('🎬 Falling back to hardcoded movies...')
      await loadHardcodedMovies()
    } finally {
      setMoviesLoading(false)
    }
  }

  const loadMoviesFromDatabase = async () => {
    try {
      const response = await fetch('/api/movies?limit=100')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      console.log(`🎬 Loaded ${data.movies.length} movies from database`)
      setMovies(data.movies || [])
    } catch (error) {
      console.error('❌ Error loading movies from database:', error)
      throw error // Rzuć błąd aby uruchomić fallback
    }
  }

  const loadHardcodedMovies = async () => {
    const movieIds = [
      'tt15398776', // Oppenheimer (2023)
      'tt1517268', // Barbie (2023)
      'tt5433140', // Fast X (2023)
      'tt9362722', // Spider-Man: Across the Spider-Verse (2023)
      'tt10640346', // The Batman (2022)
      'tt10872600', // Spider-Man: No Way Home (2021)
      'tt9419884', // Doctor Strange in the Multiverse of Madness (2022)
      'tt6791350', // Guardians of the Galaxy Vol. 3 (2023)
      'tt10366206', // John Wick: Chapter 4 (2023)
      'tt10676052', // The Little Mermaid (2023)
    ]

    const moviePromises = movieIds.map(async (id) => {
      try {
        const response = await fetch(`/api/movies/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log(`Movie ${id} not found - skipping`)
            return null
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.error) {
          console.log(`Error for movie ${id}:`, data.error)
          return null
        }
        
        const cinemas = ['Helios Rzeszów', 'Multikino Rzeszów', 'Cinema City Rzeszów']
        const showtimes = cinemas.map(cinema => ({
          cinema,
          time: `${Math.floor(Math.random() * 6) + 16}:${Math.random() > 0.5 ? '00' : '30'}`,
          price: Math.floor(Math.random() * 10) + 20
        }))

        return {
          ...data,
          showtimes
        }
      } catch (error) {
        console.log(`Error loading movie ${id}:`, error instanceof Error ? error.message : 'Unknown error')
        return null
      }
    })

    try {
      const movieResults = await Promise.all(moviePromises)
      const validMovies = movieResults.filter(movie => movie !== null && movie !== undefined)
      
      console.log(`🎬 Loaded ${validMovies.length} movies:`, validMovies.map(m => m?.title || m?.Title || 'Unknown'))
      
      setMovies(validMovies)
      setFilteredMovies(validMovies)
    } catch (error) {
      console.error('Error processing movie results:', error)
      setMovies([])
      setFilteredMovies([])
    }
  }

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        })
        await fetchPreferences(session.user.id)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPreferences = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session found')
        return
      }

      const response = await fetch('/api/prefs', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        console.error('Error fetching preferences:', response.statusText)
        return
      }

      const data = await response.json()
      if (data && typeof data === 'object') {
        setPreferences(data)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
      // Ustaw domyślne preferencje w przypadku błędu
      setPreferences({
        user_id: userId,
        genres: [],
        favorite_cinemas: [],
        favorite_cities: [],
        people: [],
        min_imdb: 0,
        alerts_enabled: false,
        email_notifications: false,
        push_notifications: false
      })
    }
  }

  const handleAuthSuccess = (user: any) => {
    if (user?.id) {
      setUser({
        id: user.id,
        email: user.email || '',
      })
      setShowAuthModal(false)
      fetchPreferences(user.id)
    }
  }

  const fetchMovieDetails = async (imdbId: string) => {
    if (!imdbId || typeof imdbId !== 'string') {
      return
    }
    
    setLoadingDetails(true)
    try {
      const response = await fetch(`/api/movies/${imdbId}`)
      if (response.ok) {
        const details = await response.json()
        if (details && typeof details === 'object') {
          setMovieDetails(details)
        }
      }
    } catch (error) {
      // Cichy błąd - nie pokazujemy użytkownikowi
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleMovieClick = (movie: any) => {
    try {
      if (movie && typeof movie === 'object') {
        setSelectedMovie(movie)
        setShowMovieModal(true)
        setMovieDetails(null) // Reset details
        
        // Pobierz szczegóły z OMDb jeśli mamy imdb_id
        const imdbId = movie.imdb_id || movie.imdbID
        if (imdbId && typeof imdbId === 'string' && imdbId.trim() !== '') {
          fetchMovieDetails(imdbId)
        }
      }
    } catch (error) {
      console.error('Error in handleMovieClick:', error)
      // Fallback - pokaż modal nawet jeśli jest błąd
      setSelectedMovie(movie)
      setShowMovieModal(true)
      setMovieDetails(null)
    }
  }

  const loadMovieAlerts = async (userId: string) => {
    if (!userId || typeof userId !== 'string') {
      return
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch('/api/alerts', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (response.ok) {
        const alerts = await response.json()
        if (Array.isArray(alerts)) {
          const movieIds = new Set<string>()
          
          alerts.forEach((alert: any) => {
            if (alert?.showtimes?.movie_id) {
              movieIds.add(alert.showtimes.movie_id.toString())
            }
            if (alert?.reason && alert.reason.includes('Alert dla filmu:')) {
              const match = alert.reason.match(/Alert dla filmu: (.+)/)
              if (match) {
                movieIds.add(match[1])
              }
            }
          })
          
          setMovieAlerts(movieIds)
        }
      }
    } catch (error) {
      console.error('Error loading movie alerts:', error)
    }
  }

  const handleNotifyMovie = async (movie: any) => {
    if (!user) return

    const movieId = movie.id || movie.imdbId
    const movieTitle = movie.title || movie.Title || movie.imdb_id || movie.imdbId || 'Nieznany film'
    const movieKey = movieId ? movieId.toString() : movieTitle

    if (!movieKey) {
      setSaveMessage({type: 'error', text: 'Brak danych filmu - nie można utworzyć alertu'})
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('No session found')
      return
    }

    const existingResponse = await fetch('/api/alerts', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    })

    let hasAlert = false
    let existingAlerts = []
    if (existingResponse.ok) {
      existingAlerts = await existingResponse.json()
      hasAlert = existingAlerts.some((alert: any) => 
        alert.reason === `Alert dla filmu: ${movieTitle}`
      )
    }

    try {
      if (hasAlert) {
        const alertToDelete = existingAlerts.find((alert: any) => 
          alert.reason === `Alert dla filmu: ${movieTitle}`
        )

        if (alertToDelete) {
          const response = await fetch('/api/alerts', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ alert_id: alertToDelete.id })
          })

          if (response.ok) {
            setMovieAlerts(prev => {
              const newSet = new Set(prev)
              newSet.delete(movieKey)
              return newSet
            })
            
            setSaveMessage({type: 'success', text: `Alert dla filmu "${movieTitle}" został usunięty!`})
            loadMovieAlerts(user.id)
          } else {
            setSaveMessage({type: 'error', text: 'Błąd usuwania alertu'})
          }
        }
      } else {
        const movieData = {
          movie_id: movieId,
          showtime_id: null,
          alert_type: 'new_movie',
          reason: `Alert dla filmu: ${movieTitle}`
        }

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
          
          setMovieAlerts(prev => new Set([...prev, movieKey]))
          setSaveMessage({type: 'success', text: `Alert dla filmu "${movieTitle}" został utworzony!`})
          loadMovieAlerts(user.id)
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('Error creating notification:', errorData)
          setSaveMessage({type: 'error', text: `Błąd: ${errorData.error || 'Nie udało się utworzyć alertu'}`})
        }
      }
      
      setTimeout(() => {
        setSaveMessage(null)
      }, 3000)
      
    } catch (error) {
      console.error('Error handling notification:', error)
      setSaveMessage({type: 'error', text: 'Błąd połączenia'})
      
      setTimeout(() => {
        setSaveMessage(null)
      }, 3000)
    }
  }

  const handleSavePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return

    try {
      setSaveMessage(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session found')
        setSaveMessage({type: 'error', text: 'Błąd: Brak sesji użytkownika'})
        return
      }

      const response = await fetch('/api/prefs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(newPreferences)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error saving preferences:', response.statusText, errorData)
        setSaveMessage({type: 'error', text: `Błąd zapisywania: ${errorData.error || response.statusText}`})
        return
      }

      const savedData = await response.json()
      console.log('✅ Preferences saved successfully:', savedData)

      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null)
      
      try {
        const matchingResponse = await fetch('/api/matching', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (matchingResponse.ok) {
          console.log('✅ Matching completed successfully')
          setSaveMessage({type: 'success', text: 'Preferencje zostały zapisane pomyślnie! Dopasowywanie filmów zostało uruchomione.'})
        } else {
          console.error('Error running matching:', matchingResponse.statusText)
          setSaveMessage({type: 'success', text: 'Preferencje zostały zapisane, ale wystąpił błąd podczas dopasowywania filmów.'})
        }
      } catch (error) {
        console.error('Error running matching:', error)
        setSaveMessage({type: 'success', text: 'Preferencje zostały zapisane, ale wystąpił błąd podczas dopasowywania filmów.'})
      }

      setTimeout(() => {
        setSaveMessage(null)
      }, 5000)

    } catch (error) {
      console.error('Error saving preferences:', error)
      setSaveMessage({type: 'error', text: `Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`})
      
      setTimeout(() => {
        setSaveMessage(null)
      }, 5000)
    }
  }

  const handleLogout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
      }
      
      await supabase.auth.signOut()
      setUser(null)
      setPreferences(null)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-8 relative">
            <div className="w-full h-full bg-gradient-to-br from-red-500 to-blue-500 rounded-2xl flex items-center justify-center animate-pulse-logo shadow-2xl">
              <span className="text-4xl">🎬</span>
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-blue-500 rounded-2xl blur opacity-30 animate-pulse"></div>
          </div>
          <h2 className="text-5xl font-bold gradient-text-hero mb-4">Kino Alert</h2>
          <p className="text-gray-400 text-lg">Ładowanie aplikacji...</p>
        </div>
      </div>
    )
  }

  // Dla niezalogowanych użytkowników pokazujemy tylko filmy bez funkcji wymagających logowania
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-x-hidden">
        {/* Header dla niezalogowanych - bez nawigacji */}
        <header className="glass-nav sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🎬</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Kino Alert
                  </h1>
                  <p className="text-gray-400 text-sm">Przeglądaj filmy w kinach</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn btn-primary"
              >
                Zaloguj się
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

          {/* Komunikat o zalogowaniu dla pełnych funkcji */}
          <div className="mb-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 backdrop-blur-xl">
            <div className="flex items-center space-x-2">
              <span>ℹ️</span>
              <span>Zaloguj się, aby korzystać z spersonalizowanych powiadomień i alertów o filmach!</span>
            </div>
          </div>

          {/* Sekcja filmów */}
          <div className="w-full">
            {/* Filtry */}
            <div className="mb-8 sm:mb-12">
              <div className="card p-6 sm:p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white">Filtruj filmy</h3>
                    <p className="text-gray-200 text-base font-medium">Znajdź idealny film dla siebie</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-base font-bold text-white mb-3 flex items-center">
                        <span className="w-7 h-7 bg-red-500/20 rounded-full flex items-center justify-center mr-3">
                          🎭
                        </span>
                        Gatunek
                      </label>
                      <select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="select"
                      >
                        <option value="all">Wszystkie gatunki</option>
                        <option value="action">Akcja</option>
                        <option value="drama">Dramat</option>
                        <option value="comedy">Komedia</option>
                        <option value="thriller">Thriller</option>
                        <option value="crime">Kryminał</option>
                        <option value="adventure">Przygoda</option>
                        <option value="fantasy">Fantasy</option>
                        <option value="sci-fi">Science Fiction</option>
                        <option value="horror">Horror</option>
                        <option value="romance">Romans</option>
                        <option value="animation">Animacja</option>
                        <option value="documentary">Dokument</option>
                        <option value="biography">Biografia</option>
                        <option value="history">Historia</option>
                        <option value="mystery">Mystery</option>
                        <option value="family">Rodzinny</option>
                        <option value="war">Wojenny</option>
                        <option value="western">Western</option>
                        <option value="musical">Musical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-base font-bold text-white mb-3 flex items-center">
                        <span className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                          🏢
                        </span>
                        Kino
                      </label>
                      <select
                        value={selectedCinema}
                        onChange={(e) => setSelectedCinema(e.target.value)}
                        className="select"
                      >
                        <option value="all">Wszystkie kina</option>
                        <option value="helios">Helios</option>
                        <option value="multikino">Multikino</option>
                        <option value="cinema city">Cinema City</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSelectedGenre('all')
                        setSelectedCinema('all')
                      }}
                      className="btn btn-outline w-full lg:w-auto flex items-center justify-center text-base font-bold py-3"
                    >
                      <span className="mr-3 text-lg">🧹</span>
                      Wyczyść filtry
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Liczba dostępnych filmów */}
            <div className="mb-6 p-4 rounded-lg bg-gray-900/80 border border-gray-600/50 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-xl">🎬</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Dostępne filmy</h4>
                    <p className="text-gray-400 text-sm">Znaleziono {filteredMovies.length} filmów</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-400">{filteredMovies.length}</div>
                  <div className="text-xs text-gray-500">filmów</div>
                </div>
              </div>
            </div>

            {moviesLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="w-full h-full bg-gradient-to-br from-red-500 to-blue-500 rounded-2xl flex items-center justify-center animate-pulse-logo shadow-2xl">
                    <span className="text-2xl">🎬</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-blue-500 rounded-2xl blur opacity-30 animate-pulse"></div>
                </div>
                <p className="text-gray-400 text-lg">Ładowanie filmów z OMDb...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 overflow-x-hidden">
                {filteredMovies.filter(movie => movie && typeof movie === 'object').map((movie, index) => {
                  const colors = [
                    'from-red-500 to-red-600',
                    'from-blue-500 to-blue-600', 
                    'from-purple-500 to-purple-600',
                    'from-green-500 to-green-600',
                    'from-yellow-500 to-yellow-600',
                    'from-pink-500 to-pink-600',
                    'from-indigo-500 to-indigo-600',
                    'from-teal-500 to-teal-600'
                  ]
                  const colorClass = colors[index % colors.length]
                  
                  return (
                    <div key={movie.id || movie.imdb_id || movie.imdbID || `movie-${index}`} className="card-movie cursor-pointer group">
                      <div className="relative h-80 sm:h-96 overflow-hidden rounded-t-2xl">
                        {movie.poster_url && movie.poster_url !== 'N/A' ? (
                          <img 
                            src={movie.poster_url} 
                            alt={movie.title || movie.Title}
                            className="movie-poster w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                              if (nextElement) {
                                nextElement.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gradient-to-br from-gray-800 to-gray-900" style={{display: movie.poster_url && movie.poster_url !== 'N/A' ? 'none' : 'flex'}}>
                          <div className="text-6xl sm:text-8xl mb-4 opacity-50">🎬</div>
                          <span className="text-sm sm:text-base font-medium text-center px-4 text-gray-300">
                            {movie.title || movie.Title}
                          </span>
                        </div>
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        
                        {/* Rating Badge */}
                        {(movie.imdb_rating || movie.imdbRating) && (
                          <div className="absolute top-3 right-3 bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm">
                            ⭐ {movie.imdb_rating || movie.imdbRating}
                          </div>
                        )}
                        
                        {/* Age Rating */}
                        {(movie.rated || movie.Rated) && (movie.rated || movie.Rated) !== 'N/A' && (
                          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm">
                            {movie.rated || movie.Rated}
                          </div>
                        )}
                        
                        {/* Login prompt for notifications */}
                        <button
                          onClick={() => setShowAuthModal(true)}
                          className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm border-2 border-gray-600 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:border-red-500 hover:text-red-400 hover:bg-red-500/20"
                          title="Zaloguj się, aby otrzymywać powiadomienia o tym filmie"
                        >
                          <span className="text-lg">🔔</span>
                        </button>
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-300 border border-white/20">
                            <span className="text-2xl">▶️</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-5 sm:p-6 bg-gray-900/50 backdrop-blur-sm">
                        <h4 className="text-xl sm:text-2xl font-bold mb-3 text-white line-clamp-2 group-hover:text-red-400 transition-colors">
                          {translateTitle(movie.title || movie.Title)}
                        </h4>
                        <p className="text-gray-200 mb-4 text-base font-medium">
                          {translateGenre(movie.genre || movie.Genre || '')} • {movie.year || movie.Year}
                        </p>
                        
                        <div className="space-y-3 mb-4">
                          {movie.showtimes?.slice(0, 2).map((showtime: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-800/70 rounded-lg px-4 py-3 border border-gray-700/50">
                              <span className="text-white text-base font-medium truncate">{showtime.cinema}</span>
                              <span className="font-bold text-yellow-400 text-lg">{showtime.time}</span>
                            </div>
                          ))}
                          {movie.showtimes?.length > 2 && (
                            <div className="text-center">
                              <span className="text-sm text-gray-300 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700/50 font-medium">
                                +{movie.showtimes.length - 2} więcej seansów
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => {
                            if (movie) {
                              handleMovieClick(movie)
                            }
                          }}
                          className="w-full btn btn-primary text-base py-4 font-bold"
                        >
                          🔍 o filmie
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>

        {/* Modal logowania */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card p-8 max-w-md w-full animate-scale-in backdrop-blur-xl border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Zaloguj się</h3>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>
              <AuthForm onAuthSuccess={handleAuthSuccess} />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-x-hidden">
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-lg">🎬</span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  Kino Alert
                </h1>
              </div>
              <div className="hidden md:flex space-x-1">
                {[
                  { id: 'all-movies', label: 'Wszystkie filmy' },
                  { id: 'matches', label: 'Dla Ciebie' },
                  { id: 'preferences', label: 'Preferencje' },
                  { id: 'alerts', label: 'Alerty' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-red-500/20 to-blue-500/20 text-white border border-white/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="hidden sm:block text-sm text-gray-400 truncate max-w-32">{user.email}</span>
              <button
                onClick={handleLogout}
                className="btn btn-outline text-white border-white/30 hover:bg-white hover:text-gray-900 text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col space-y-2">
              {[
                { id: 'all-movies', label: 'Wszystkie filmy' },
                { id: 'matches', label: 'Dla Ciebie' },
                { id: 'preferences', label: 'Preferencje' },
                { id: 'alerts', label: 'Alerty' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any)
                    setShowMobileMenu(false)
                  }}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 text-left ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-red-500/20 to-blue-500/20 text-white border border-white/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Komunikat o zapisywaniu preferencji */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg animate-fade-in backdrop-blur-xl border ${
            saveMessage.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{saveMessage.type === 'success' ? '✅' : '❌'}</span>
              <span>{saveMessage.text}</span>
            </div>
          </div>
        )}

        {activeTab === 'matches' && <MovieMatches userId={user.id} />}
        {activeTab === 'all-movies' && (
          <div className="w-full">
            {/* Filtry */}
            <div className="mb-8 sm:mb-12">
              <div className="card p-6 sm:p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white">Filtruj filmy</h3>
                    <p className="text-gray-200 text-base font-medium">Znajdź idealny film dla siebie</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-base font-bold text-white mb-3 flex items-center">
                        <span className="w-7 h-7 bg-red-500/20 rounded-full flex items-center justify-center mr-3">
                          🎭
                        </span>
                        Gatunek
                      </label>
                      <select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="select"
                      >
                        <option value="all">Wszystkie gatunki</option>
                        <option value="action">Akcja</option>
                        <option value="drama">Dramat</option>
                        <option value="comedy">Komedia</option>
                        <option value="thriller">Thriller</option>
                        <option value="crime">Kryminał</option>
                        <option value="adventure">Przygoda</option>
                        <option value="fantasy">Fantasy</option>
                        <option value="sci-fi">Science Fiction</option>
                        <option value="horror">Horror</option>
                        <option value="romance">Romans</option>
                        <option value="animation">Animacja</option>
                        <option value="documentary">Dokument</option>
                        <option value="biography">Biografia</option>
                        <option value="history">Historia</option>
                        <option value="mystery">Mystery</option>
                        <option value="family">Rodzinny</option>
                        <option value="war">Wojenny</option>
                        <option value="western">Western</option>
                        <option value="musical">Musical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-base font-bold text-white mb-3 flex items-center">
                        <span className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                          🏢
                        </span>
                        Kino
                      </label>
                      <select
                        value={selectedCinema}
                        onChange={(e) => setSelectedCinema(e.target.value)}
                        className="select"
                      >
                        <option value="all">Wszystkie kina</option>
                        <option value="helios">Helios</option>
                        <option value="multikino">Multikino</option>
                        <option value="cinema city">Cinema City</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSelectedGenre('all')
                        setSelectedCinema('all')
                      }}
                      className="btn btn-outline w-full lg:w-auto flex items-center justify-center text-base font-bold py-3"
                    >
                      <span className="mr-3 text-lg">🧹</span>
                      Wyczyść filtry
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Liczba dostępnych filmów */}
            <div className="mb-6 p-4 rounded-lg bg-gray-900/80 border border-gray-600/50 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-xl">🎬</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Dostępne filmy</h4>
                    <p className="text-gray-400 text-sm">Znaleziono {filteredMovies.length} filmów</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-400">{filteredMovies.length}</div>
                  <div className="text-xs text-gray-500">filmów</div>
                </div>
              </div>
            </div>

            {moviesLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="w-full h-full bg-gradient-to-br from-red-500 to-blue-500 rounded-2xl flex items-center justify-center animate-pulse-logo shadow-2xl">
                    <span className="text-2xl">🎬</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-blue-500 rounded-2xl blur opacity-30 animate-pulse"></div>
                </div>
                <p className="text-gray-400 text-lg">Ładowanie filmów z OMDb...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 overflow-x-hidden">
                {filteredMovies.filter(movie => movie && typeof movie === 'object').map((movie, index) => {
                  const colors = [
                    'from-red-500 to-red-600',
                    'from-blue-500 to-blue-600', 
                    'from-purple-500 to-purple-600',
                    'from-green-500 to-green-600',
                    'from-yellow-500 to-yellow-600',
                    'from-pink-500 to-pink-600',
                    'from-indigo-500 to-indigo-600',
                    'from-teal-500 to-teal-600'
                  ]
                  const colorClass = colors[index % colors.length]
                  
                  return (
                    <div key={movie.id || movie.imdb_id || movie.imdbID || `movie-${index}`} className="card-movie cursor-pointer group">
                      <div className="relative h-80 sm:h-96 overflow-hidden rounded-t-2xl">
                        {movie.poster_url && movie.poster_url !== 'N/A' ? (
                          <img 
                            src={movie.poster_url} 
                            alt={movie.title || movie.Title}
                            className="movie-poster w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                              if (nextElement) {
                                nextElement.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gradient-to-br from-gray-800 to-gray-900" style={{display: movie.poster_url && movie.poster_url !== 'N/A' ? 'none' : 'flex'}}>
                          <div className="text-6xl sm:text-8xl mb-4 opacity-50">🎬</div>
                          <span className="text-sm sm:text-base font-medium text-center px-4 text-gray-300">
                            {movie.title || movie.Title}
                          </span>
                        </div>
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        
                        {/* Rating Badge */}
                        {(movie.imdb_rating || movie.imdbRating) && (
                          <div className="absolute top-3 right-3 bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm">
                            ⭐ {movie.imdb_rating || movie.imdbRating}
                          </div>
                        )}
                        
                        {/* Age Rating */}
                        {(movie.rated || movie.Rated) && (movie.rated || movie.Rated) !== 'N/A' && (
                          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm">
                            {movie.rated || movie.Rated}
                          </div>
                        )}
                        
                        {/* Notification Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNotifyMovie(movie)
                          }}
                          className={`absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm border-2 p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
                            movieAlerts.has((movie.id || movie.imdbId) ? (movie.id || movie.imdbId).toString() : (movie.title || movie.Title || movie.imdb_id || movie.imdbId || 'Nieznany film')) 
                              ? 'border-red-500 text-red-400 bg-red-500/20' 
                              : 'border-gray-600 text-white hover:border-red-500 hover:text-red-400 hover:bg-red-500/20'
                          }`}
                          title={movieAlerts.has((movie.id || movie.imdbId) ? (movie.id || movie.imdbId).toString() : (movie.title || movie.Title || movie.imdb_id || movie.imdbId || 'Nieznany film')) ? "Usuń alert" : "Powiadom o tym filmie"}
                        >
                          <span className="text-lg">🔔</span>
                        </button>
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-300 border border-white/20">
                            <span className="text-2xl">▶️</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-5 sm:p-6 bg-gray-900/50 backdrop-blur-sm">
                        <h4 className="text-xl sm:text-2xl font-bold mb-3 text-white line-clamp-2 group-hover:text-red-400 transition-colors">
                          {translateTitle(movie.title || movie.Title)}
                        </h4>
                        <p className="text-gray-200 mb-4 text-base font-medium">
                          {translateGenre(movie.genre || movie.Genre || '')} • {movie.year || movie.Year}
                        </p>
                        
                        <div className="space-y-3 mb-4">
                          {movie.showtimes?.slice(0, 2).map((showtime: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-800/70 rounded-lg px-4 py-3 border border-gray-700/50">
                              <span className="text-white text-base font-medium truncate">{showtime.cinema}</span>
                              <span className="font-bold text-yellow-400 text-lg">{showtime.time}</span>
                            </div>
                          ))}
                          {movie.showtimes?.length > 2 && (
                            <div className="text-center">
                              <span className="text-sm text-gray-300 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700/50 font-medium">
                                +{movie.showtimes.length - 2} więcej seansów
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => {
                            if (movie) {
                              handleMovieClick(movie)
                            }
                          }}
                          className="w-full btn btn-primary text-base py-4 font-bold"
                        >
                          🔍 o filmie
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'preferences' && (
          <PreferencesForm
            userId={user.id}
            initialPreferences={preferences}
            onSave={handleSavePreferences}
          />
        )}
        {activeTab === 'alerts' && <AlertHistory />}
      </main>

      {/* Modal filmu */}
      {showMovieModal && selectedMovie && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl sm:text-3xl font-bold text-white gradient-text">
                {translateTitle(selectedMovie?.title || selectedMovie?.Title || 'Nieznany film')}
              </h3>
              <button
                onClick={() => setShowMovieModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Plakat filmu */}
              <div className="lg:col-span-1">
                <div className="relative">
                  {(movieDetails?.poster_url || selectedMovie?.poster_url) && (movieDetails?.poster_url || selectedMovie?.poster_url) !== 'N/A' ? (
                    <img 
                      src={movieDetails?.poster_url || selectedMovie?.poster_url} 
                      alt={selectedMovie?.title || selectedMovie?.Title || 'Film'}
                      className="w-full h-96 object-cover rounded-xl shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex flex-col items-center justify-center shadow-lg">
                      <div className="text-6xl mb-4 opacity-50">🎬</div>
                      <span className="text-lg font-medium text-gray-300">
                        {selectedMovie?.title || selectedMovie?.Title || 'Film'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Informacje o filmie */}
              <div className="lg:col-span-2 space-y-6">
                {/* Wskaźnik ładowania */}
                {loadingDetails && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-gray-300">Ładowanie szczegółów filmu...</span>
                  </div>
                )}
                
                {/* Informacja o braku szczegółów */}
                {!loadingDetails && !movieDetails && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                    <p className="text-blue-300 text-sm">
                      ℹ️ Wyświetlane są podstawowe informacje o filmie. Aby zobaczyć pełne szczegóły (opis, aktorzy, reżyser), skonfiguruj OMDb API w pliku .env.local
                    </p>
                  </div>
                )}
                
                {/* Podstawowe informacje */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">📊 Ocena IMDb</h4>
                    <p className="text-yellow-400 font-bold text-xl">
                      ⭐ {(movieDetails?.imdb_rating || selectedMovie?.imdb_rating || selectedMovie?.imdbRating) || 'Brak oceny'}/10
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">🎭 Gatunek</h4>
                    <p className="text-gray-300">
                      {translateGenre(movieDetails?.genre || selectedMovie?.genre || selectedMovie?.Genre || 'Brak informacji')}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">📅 Rok produkcji</h4>
                    <p className="text-gray-300">{movieDetails?.year || selectedMovie?.year || selectedMovie?.Year || 'Brak informacji'}</p>
                  </div>
                  
                  {(movieDetails?.rated || selectedMovie?.rated) && (movieDetails?.rated || selectedMovie?.rated) !== 'N/A' && (
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">🔞 Wiek</h4>
                      <p className="text-gray-300">{movieDetails?.rated || selectedMovie?.rated}</p>
                    </div>
                  )}
                </div>

                {/* Reżyser i aktorzy */}
                {(movieDetails?.director || movieDetails?.actors) && (
                  <div className="space-y-4">
                    {movieDetails?.director && (
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2">🎬 Reżyser</h4>
                        <p className="text-gray-300">{movieDetails.director}</p>
                      </div>
                    )}
                    
                    {movieDetails?.actors && (
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2">👥 Aktorzy</h4>
                        <p className="text-gray-300">{movieDetails.actors}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Opis filmu */}
                {movieDetails?.plot && (
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">📖 Opis</h4>
                    <p className="text-gray-300 leading-relaxed">{movieDetails.plot}</p>
                  </div>
                )}

                {/* Dodatkowe informacje */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {movieDetails?.runtime && (
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">⏱️ Czas trwania</h4>
                      <p className="text-gray-300">{movieDetails.runtime}</p>
                    </div>
                  )}
                  
                  {movieDetails?.language && (
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">🗣️ Język</h4>
                      <p className="text-gray-300">{movieDetails.language}</p>
                    </div>
                  )}
                  
                  {movieDetails?.country && (
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">🌍 Kraj</h4>
                      <p className="text-gray-300">{movieDetails.country}</p>
                    </div>
                  )}
                  
                  {movieDetails?.awards && movieDetails.awards !== 'N/A' && (
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">🏆 Nagrody</h4>
                      <p className="text-gray-300 text-sm">{movieDetails.awards}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Seanse */}
            {selectedMovie?.showtimes && selectedMovie.showtimes.length > 0 && (
              <div className="mt-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">🎫</span>
                  Dostępne seanse
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedMovie.showtimes.map((showtime: any, idx: number) => (
                    <div key={idx} className="bg-gray-900/70 rounded-lg p-4 border border-gray-600/50 hover:border-gray-500/50 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white font-semibold text-sm">{showtime?.cinema || 'Nieznane kino'}</span>
                        <span className="text-yellow-400 font-bold text-lg">{showtime?.time || 'Brak godziny'}</span>
                      </div>
                      {showtime?.price && (
                        <p className="text-green-400 font-medium text-sm">Cena: {showtime.price} zł</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Przycisk zamykania */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowMovieModal(false)}
                className="btn btn-primary"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}