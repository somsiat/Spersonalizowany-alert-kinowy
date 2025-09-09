'use client'

import { useState } from 'react'
import MovieSearch from '@/components/MovieSearch'
import BulkMovieAdd from '@/components/BulkMovieAdd'
import UpdatePosters from '@/components/UpdatePosters'

export default function TestPage() {
  const [scrapingResult, setScrapingResult] = useState('')
  const [matchingResult, setMatchingResult] = useState('')
  const [notificationResult, setNotificationResult] = useState('')

  const runScraping = async () => {
    try {
      const response = await fetch('/api/scrape', { method: 'POST' })
      const data = await response.json()
      setScrapingResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setScrapingResult(`Error: ${error}`)
    }
  }

  const runMatching = async () => {
    try {
      const response = await fetch('/api/matching', { method: 'POST' })
      const data = await response.json()
      setMatchingResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setMatchingResult(`Error: ${error}`)
    }
  }

  const runNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', { method: 'POST' })
      const data = await response.json()
      setNotificationResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setNotificationResult(`Error: ${error}`)
    }
  }

  const testMovieAPI = async () => {
    try {
      const response = await fetch('/api/movies/tt3896198')
      const data = await response.json()
      console.log('Movie API test result:', data)
      alert('Movie API test completed. Check console for results.')
    } catch (error) {
      alert(`Movie API test error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Strona Testowa</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Movie API */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Test Movie API</h2>
            <p className="text-black mb-4">
              Testuje pobieranie danych filmu z OMDb API
            </p>
            <button
              onClick={testMovieAPI}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Movie API
            </button>
          </div>

          {/* Test Scraping */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Test Scraping</h2>
            <p className="text-black mb-4">
              Uruchamia scrapery repertuarów kin
            </p>
            <button
              onClick={runScraping}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Uruchom Scraping
            </button>
            {scrapingResult && (
              <pre className="mt-4 p-3 bg-gray-100 rounded text-sm overflow-auto">
                {scrapingResult}
              </pre>
            )}
          </div>

          {/* Test Matching */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Test Matching</h2>
            <p className="text-black mb-4">
              Uruchamia algorytm dopasowywania filmów
            </p>
            <button
              onClick={runMatching}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Uruchom Matching
            </button>
            {matchingResult && (
              <pre className="mt-4 p-3 bg-gray-100 rounded text-sm overflow-auto">
                {matchingResult}
              </pre>
            )}
          </div>

          {/* Test Notifications */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Test Notifications</h2>
            <p className="text-black mb-4">
              Uruchamia system powiadomień
            </p>
            <button
              onClick={runNotifications}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            >
              Uruchom Notifications
            </button>
            {notificationResult && (
              <pre className="mt-4 p-3 bg-gray-100 rounded text-sm overflow-auto">
                {notificationResult}
              </pre>
            )}
          </div>
        </div>

        {/* Movie Search Component */}
        <div className="mt-8">
          <MovieSearch />
        </div>

        {/* Bulk Movie Add Component */}
        <div className="mt-8">
          <BulkMovieAdd />
        </div>

        {/* Update Posters Component */}
        <div className="mt-8">
          <UpdatePosters />
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">📋 Instrukcje</h2>
          <div className="space-y-2 text-black">
            <p>1. <strong>Movie API:</strong> Testuje integrację z OMDb API</p>
            <p>2. <strong>Scraping:</strong> Pobiera repertuary z kin (symulacja)</p>
            <p>3. <strong>Matching:</strong> Znajduje dopasowania dla użytkowników</p>
            <p>4. <strong>Notifications:</strong> Wysyła powiadomienia o nowych dopasowaniach</p>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Uwaga</h3>
          <p className="text-yellow-700">
            Ta strona jest przeznaczona do testowania funkcjonalności backendu. 
            W rzeczywistej implementacji scrapery byłyby uruchamiane automatycznie 
            przez cron jobs, a powiadomienia wysyłane w tle.
          </p>
        </div>
      </div>
    </div>
  )
}
