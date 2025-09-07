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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Twoje preferencje filmowe</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Ulubione gatunki */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Ulubione gatunki
          </label>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {GENRES.map(genre => (
              <label key={genre} className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.genres?.includes(genre) || false}
                  onChange={() => handleGenreToggle(genre)}
                  className="mr-2"
                />
                <span className="text-sm">{genre}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ulubione miasta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Ulubione miasta
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {CITIES.map(city => (
              <label key={city} className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.favorite_cities?.includes(city) || false}
                  onChange={() => handleCityToggle(city)}
                  className="mr-2"
                />
                <span className="text-sm">{city}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ulubione kina */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Ulubione kina
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CINEMAS.map(cinema => (
              <label key={cinema.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.favorite_cinemas?.includes(cinema.id) || false}
                  onChange={() => handleCinemaToggle(cinema.id)}
                  className="mr-2"
                />
                <span className="text-sm">{cinema.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ulubieni ludzie (reżyserzy i aktorzy) */}
        <div>
          <label htmlFor="people" className="block text-sm font-medium text-gray-700 mb-2">
            Ulubieni reżyserzy i aktorzy (oddzielone przecinkami)
          </label>
          <input
            id="people"
            type="text"
            value={preferences.people?.join(', ') || ''}
            onChange={(e) => handlePeopleInput(e.target.value)}
            placeholder="np. Christopher Nolan, Leonardo DiCaprio, Tom Hanks"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>


        {/* Minimalna ocena */}
        <div>
          <label htmlFor="minRating" className="block text-sm font-medium text-gray-700 mb-2">
            Minimalna ocena IMDb (0-10)
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>


        {/* Ustawienia powiadomień */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Powiadomienia
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.alerts_enabled || false}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  alerts_enabled: e.target.checked
                }))}
                className="mr-2"
              />
              <span className="text-sm">Włącz powiadomienia</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.email_notifications || false}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  email_notifications: e.target.checked
                }))}
                className="mr-2"
              />
              <span className="text-sm">Powiadomienia e-mail</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.push_notifications || false}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  push_notifications: e.target.checked
                }))}
                className="mr-2"
              />
              <span className="text-sm">Powiadomienia push</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Zapisz preferencje
        </button>
      </form>
    </div>
  )
}
