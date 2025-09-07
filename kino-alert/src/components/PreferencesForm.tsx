'use client'

import { useState, useEffect } from 'react'
import { UserPreferences } from '@/lib/auth'

interface PreferencesFormProps {
  userId: string
  initialPreferences?: UserPreferences | null
  onSave: (preferences: Partial<UserPreferences>) => void
}

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'Film-Noir', 'History', 'Horror', 'Music', 'Musical',
  'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'
]

const CINEMAS = [
  { id: 1, name: 'Helios Rzeszów' },
  { id: 2, name: 'Multikino Rzeszów' },
  { id: 3, name: 'Cinema City Rzeszów' },
  { id: 4, name: 'Helios Kraków' },
  { id: 5, name: 'Multikino Kraków' },
  { id: 6, name: 'Cinema City Kraków' },
  { id: 7, name: 'Helios Warszawa' },
  { id: 8, name: 'Multikino Warszawa' },
  { id: 9, name: 'Cinema City Warszawa' }
]

const CITIES = [
  'Rzeszów', 'Kraków', 'Warszawa', 'Gdańsk', 'Wrocław', 'Poznań', 'Łódź', 'Katowice'
]

export default function PreferencesForm({ userId, initialPreferences, onSave }: PreferencesFormProps) {
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    favorite_cinemas: [],
    favorite_cities: [],
    genres: [],
    people: [],
    min_imdb: 7.0,
    alerts_enabled: true,
    email_notifications: true,
    push_notifications: false,
  })

  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences)
    }
  }, [initialPreferences])

  const handleGenreToggle = (genre: string) => {
    setPreferences(prev => ({
      ...prev,
      genres: prev.genres?.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...(prev.genres || []), genre]
    }))
  }

  const handleCinemaToggle = (cinemaId: number) => {
    setPreferences(prev => ({
      ...prev,
      favorite_cinemas: prev.favorite_cinemas?.includes(cinemaId)
        ? prev.favorite_cinemas.filter(c => c !== cinemaId)
        : [...(prev.favorite_cinemas || []), cinemaId]
    }))
  }

  const handleCityToggle = (city: string) => {
    setPreferences(prev => ({
      ...prev,
      favorite_cities: prev.favorite_cities?.includes(city)
        ? prev.favorite_cities.filter(c => c !== city)
        : [...(prev.favorite_cities || []), city]
    }))
  }

  const handlePeopleInput = (value: string) => {
    const people = value.split(',').map(item => item.trim()).filter(item => item)
    setPreferences(prev => ({
      ...prev,
      people: people
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(preferences)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 card">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-white gradient-text">Twoje preferencje filmowe</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Ulubione gatunki */}
        <div>
          <label className="block text-sm font-bold text-white mb-3 sm:mb-4">
            🎭 Ulubione gatunki
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {GENRES.map(genre => (
              <label key={genre} className="flex items-center p-2 sm:p-3 rounded-lg bg-gray-800/70 hover:bg-gray-700/70 transition-colors cursor-pointer border border-gray-700/50 hover:border-gray-600/50">
                <input
                  type="checkbox"
                  checked={preferences.genres?.includes(genre) || false}
                  onChange={() => handleGenreToggle(genre)}
                  className="mr-2 sm:mr-3 w-4 h-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-0 focus:outline-none"
                />
                <span className="text-xs sm:text-sm text-gray-200 font-medium">{genre}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ulubione miasta */}
        <div>
          <label className="block text-sm font-bold text-white mb-3 sm:mb-4">
            🏙️ Ulubione miasta
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {CITIES.map(city => (
              <label key={city} className="flex items-center p-2 sm:p-3 rounded-lg bg-gray-800/70 hover:bg-gray-700/70 transition-colors cursor-pointer border border-gray-700/50 hover:border-gray-600/50">
                <input
                  type="checkbox"
                  checked={preferences.favorite_cities?.includes(city) || false}
                  onChange={() => handleCityToggle(city)}
                  className="mr-2 sm:mr-3 w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-0 focus:outline-none"
                />
                <span className="text-xs sm:text-sm text-gray-200 font-medium">{city}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ulubione kina */}
        <div>
          <label className="block text-sm font-bold text-white mb-3 sm:mb-4">
            🎬 Ulubione kina
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {CINEMAS.map(cinema => (
              <label key={cinema.id} className="flex items-center p-2 sm:p-3 rounded-lg bg-gray-800/70 hover:bg-gray-700/70 transition-colors cursor-pointer border border-gray-700/50 hover:border-gray-600/50">
                <input
                  type="checkbox"
                  checked={preferences.favorite_cinemas?.includes(cinema.id) || false}
                  onChange={() => handleCinemaToggle(cinema.id)}
                  className="mr-2 sm:mr-3 w-4 h-4 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-0 focus:outline-none"
                />
                <span className="text-xs sm:text-sm text-gray-200 font-medium">{cinema.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ulubieni ludzie (reżyserzy i aktorzy) */}
        <div>
          <label htmlFor="people" className="block text-sm font-bold text-white mb-2 sm:mb-3">
            👥 Ulubieni reżyserzy i aktorzy (oddzielone przecinkami)
          </label>
          <input
            id="people"
            type="text"
            value={preferences.people?.join(', ') || ''}
            onChange={(e) => handlePeopleInput(e.target.value)}
            placeholder="np. Christopher Nolan, Leonardo DiCaprio, Tom Hanks"
            className="input"
          />
        </div>

        {/* Minimalna ocena */}
        <div>
          <label htmlFor="minRating" className="block text-sm font-bold text-white mb-2 sm:mb-3">
            ⭐ Minimalna ocena IMDb (0-10)
          </label>
          <input
            id="minRating"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={preferences.min_imdb || 7.0}
            onChange={(e) => setPreferences(prev => ({
              ...prev,
              min_imdb: parseFloat(e.target.value) || 7.0
            }))}
            className="input"
          />
        </div>

        {/* Ustawienia powiadomień */}
        <div>
          <label className="block text-sm font-bold text-white mb-3 sm:mb-4">
            🔔 Powiadomienia
          </label>
          <div className="space-y-2 sm:space-y-3">
            <label className="flex items-center p-2 sm:p-3 rounded-lg bg-gray-800/70 hover:bg-gray-700/70 transition-colors cursor-pointer border border-gray-700/50 hover:border-gray-600/50">
              <input
                type="checkbox"
                checked={preferences.alerts_enabled || false}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  alerts_enabled: e.target.checked
                }))}
                className="mr-2 sm:mr-3 w-4 h-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-0 focus:outline-none"
              />
              <span className="text-xs sm:text-sm text-gray-200 font-medium">Włącz powiadomienia</span>
            </label>
            <label className="flex items-center p-2 sm:p-3 rounded-lg bg-gray-800/70 hover:bg-gray-700/70 transition-colors cursor-pointer border border-gray-700/50 hover:border-gray-600/50">
              <input
                type="checkbox"
                checked={preferences.email_notifications || false}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  email_notifications: e.target.checked
                }))}
                className="mr-2 sm:mr-3 w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-0 focus:outline-none"
              />
              <span className="text-xs sm:text-sm text-gray-200 font-medium">Powiadomienia e-mail</span>
            </label>
            <label className="flex items-center p-2 sm:p-3 rounded-lg bg-gray-800/70 hover:bg-gray-700/70 transition-colors cursor-pointer border border-gray-700/50 hover:border-gray-600/50">
              <input
                type="checkbox"
                checked={preferences.push_notifications || false}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  push_notifications: e.target.checked
                }))}
                className="mr-2 sm:mr-3 w-4 h-4 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-0 focus:outline-none"
              />
              <span className="text-xs sm:text-sm text-gray-200 font-medium">Powiadomienia push</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
        >
          💾 Zapisz preferencje
        </button>
      </form>
    </div>
  )
}
