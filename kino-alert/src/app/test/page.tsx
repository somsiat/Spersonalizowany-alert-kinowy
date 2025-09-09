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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">🧪 Strona Testowa</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Movie API */}
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">Test Movie API</h2>
            <p className="text-gray-300 mb-4">
              Testuje pobieranie danych filmu z OMDb API
            </p>
            <button
              onClick={testMovieAPI}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Test Movie API
            </button>
          </div>

          {/* Test Scraping */}
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">Test Scraping</h2>
            <p className="text-gray-300 mb-4">
              Uruchamia scrapery repertuarów kin
            </p>
            <button
              onClick={runScraping}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Uruchom Scraping
            </button>
            {scrapingResult && (
              <pre className="mt-4 p-3 bg-gray-900/80 rounded text-sm overflow-auto text-gray-300 border border-gray-700/50">
                {scrapingResult}
              </pre>
            )}
          </div>

          {/* Test Matching */}
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">Test Matching</h2>
            <p className="text-gray-300 mb-4">
              Uruchamia algorytm dopasowywania filmów
            </p>
            <button
              onClick={runMatching}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Uruchom Matching
            </button>
            {matchingResult && (
              <pre className="mt-4 p-3 bg-gray-900/80 rounded text-sm overflow-auto text-gray-300 border border-gray-700/50">
                {matchingResult}
              </pre>
            )}
          </div>

          {/* Test Notifications */}
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">Test Notifications</h2>
            <p className="text-gray-300 mb-4">
              Uruchamia system powiadomień
            </p>
            <button
              onClick={runNotifications}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Uruchom Notifications
            </button>
            {notificationResult && (
              <pre className="mt-4 p-3 bg-gray-900/80 rounded text-sm overflow-auto text-gray-300 border border-gray-700/50">
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

        <div className="mt-8 bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-white">📋 Instrukcje</h2>
          <div className="space-y-2 text-gray-300">
            <p>1. <strong className="text-white">Movie API:</strong> Testuje integrację z OMDb API</p>
            <p>2. <strong className="text-white">Scraping:</strong> Pobiera repertuary z kin (symulacja)</p>
            <p>3. <strong className="text-white">Matching:</strong> Znajduje dopasowania dla użytkowników</p>
            <p>4. <strong className="text-white">Notifications:</strong> Wysyła powiadomienia o nowych dopasowaniach</p>
          </div>
        </div>

        <div className="mt-8 bg-red-900/20 border border-red-500/30 p-6 rounded-lg backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Uwaga</h3>
          <p className="text-red-300">
            Ta strona jest przeznaczona do testowania funkcjonalności backendu. 
            W rzeczywistej implementacji scrapery byłyby uruchamiane automatycznie 
            przez cron jobs, a powiadomienia wysyłane w tle.
          </p>
        </div>
      </div>
    </div>
  )
}
