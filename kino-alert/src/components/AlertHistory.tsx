'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Alert {
  id: string
  alert_type: string
  sent_at: string
  status: string
  movie_title?: string
  movie_year?: number
  movie_genre?: string
  movie_director?: string
  movie_actors?: string
  movie_imdb_rating?: number
  movie_poster_url?: string
  movie_plot?: string
  movie_rated?: string
  movie_runtime?: string
  movies?: {
    title: string
    year: number
    poster_url: string
  }
  showtimes?: {
    show_date: string
    show_time: string
    cinemas: {
      name: string
      city: string
    }
  }
}

export default function AlertHistory() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [testingNotifications, setTestingNotifications] = useState(false)
  const [testResult, setTestResult] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [deletingAlert, setDeletingAlert] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Nie jesteś zalogowany')
        return
      }

      const response = await fetch('/api/alerts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Nie udało się pobrać alertów')
      }

      const data = await response.json()
      setAlerts(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAlertTypeText = (type: string) => {
    switch (type) {
      case 'new_movie':
        return '🎬 Nowy film'
      case 'new_showtime':
        return '🎭 Nowy seans'
      case 'reminder':
        return '⏰ Przypomnienie'
      case 'test':
        return '🧪 Test'
      default:
        return '📢 Alert'
    }
  }

  const testNotifications = async () => {
    try {
      setTestingNotifications(true)
      setTestResult(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setTestResult({type: 'error', message: 'Nie jesteś zalogowany'})
        return
      }

      const response = await fetch('/api/test-notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({type: 'success', message: data.message})
        // Odśwież listę alertów
        fetchAlerts()
      } else {
        setTestResult({type: 'error', message: data.error || 'Błąd testowania'})
      }
    } catch (error) {
      setTestResult({type: 'error', message: 'Błąd połączenia'})
    } finally {
      setTestingNotifications(false)
      // Ukryj komunikat po 5 sekundach
      setTimeout(() => {
        setTestResult(null)
      }, 5000)
    }
  }

  const deleteAlert = async (alertId: string) => {
    try {
      setDeletingAlert(alertId)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setTestResult({type: 'error', message: 'Nie jesteś zalogowany'})
        return
      }

      const response = await fetch('/api/alerts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ alert_id: alertId })
      })

      if (response.ok) {
        // Usuń alert z lokalnej listy
        setAlerts(prev => prev.filter(alert => alert.id !== alertId))
        setTestResult({type: 'success', message: 'Alert został usunięty'})
      } else {
        const data = await response.json()
        setTestResult({type: 'error', message: data.error || 'Błąd usuwania alertu'})
      }
    } catch (error) {
      setTestResult({type: 'error', message: 'Błąd połączenia'})
    } finally {
      setDeletingAlert(null)
      // Ukryj komunikat po 3 sekundach
      setTimeout(() => {
        setTestResult(null)
      }, 3000)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
        <p className="text-black">Ładowanie historii alertów...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchAlerts}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Spróbuj ponownie
        </button>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-black mb-4">
          <span className="text-4xl mb-2 block">📭</span>
          Brak alertów
        </div>
        <p className="text-black mb-6">
          Otrzymasz powiadomienia o nowych filmach i seansach pasujących do Twoich preferencji.
        </p>
        <p className="text-sm text-gray-600">
          Kliknij dzwoneczek 🔔 przy filmie, aby ustawić alert i przetestować powiadomienia.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          📢 Historia alertów ({alerts.length})
        </h3>
        
        {/* Przycisk testowania */}
        <button
          onClick={testNotifications}
          disabled={testingNotifications}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {testingNotifications ? (
            <>
              <span className="animate-spin inline-block mr-2">⏳</span>
              Testowanie...
            </>
          ) : (
            <>
              🧪 Test powiadomień
            </>
          )}
        </button>
      </div>

      {/* Komunikat o teście */}
      {testResult && (
        <div className={`mb-4 p-4 rounded-lg ${
          testResult.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {testResult.type === 'success' ? '✅' : '❌'}
            </span>
            <span>{testResult.message}</span>
          </div>
        </div>
      )}
      
      {alerts.map((alert) => (
        <div key={alert.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500 relative">
          {/* Krzyżyk do usuwania */}
          <button
            onClick={() => deleteAlert(alert.id)}
            disabled={deletingAlert === alert.id}
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Usuń alert"
          >
            {deletingAlert === alert.id ? (
              <span className="animate-spin">⏳</span>
            ) : (
              '❌'
            )}
          </button>
          
          <div className="flex items-start space-x-4">
            {(alert.movie_poster_url || alert.movies?.poster_url) && 
             (alert.movie_poster_url !== 'N/A' || alert.movies?.poster_url !== 'N/A') ? (
              <img
                src={alert.movie_poster_url || alert.movies?.poster_url}
                alt={alert.movie_title || alert.movies?.title}
                className="w-16 h-24 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-2xl">🎬</span>
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-indigo-600">
                  {getAlertTypeText(alert.alert_type)}
                </span>
                <span className="text-xs text-black">
                  {formatDate(alert.sent_at)}
                </span>
              </div>
              
              <h4 className="font-semibold text-slate-800 mb-1">
                {alert.movie_title || alert.movies?.title || (alert.reason ? alert.reason.replace('Alert dla filmu: ', '') : 'Nieznany film')} 
                {alert.movie_year || alert.movies?.year ? ` (${alert.movie_year || alert.movies?.year})` : ''}
              </h4>
              
              {/* Informacje o filmie */}
              <div className="text-sm text-black mb-2">
                {alert.movie_genre && (
                  <div>🎭 Gatunek: {alert.movie_genre}</div>
                )}
                {alert.movie_director && (
                  <div>🎬 Reżyser: {alert.movie_director}</div>
                )}
                {alert.movie_imdb_rating && (
                  <div>⭐ Ocena IMDb: {alert.movie_imdb_rating}/10</div>
                )}
                {alert.movie_rated && alert.movie_rated !== 'N/A' && (
                  <div>🔞 Kategoria: {alert.movie_rated}</div>
                )}
                {alert.movie_runtime && alert.movie_runtime !== 'N/A' && (
                  <div>⏱️ Czas: {alert.movie_runtime}</div>
                )}
              </div>
              
              {/* Informacje o seansie (jeśli dostępne) */}
              {alert.showtimes && (
                <div className="text-sm text-black border-t pt-2 mt-2">
                  <div>
                    📅 {new Date(alert.showtimes.show_date).toLocaleDateString('pl-PL')}
                  </div>
                  <div>
                    🕐 {alert.showtimes.show_time}
                  </div>
                  <div>
                    🏢 {alert.showtimes.cinemas?.name} - {alert.showtimes.cinemas?.city}
                  </div>
                </div>
              )}
              
              {/* Opis filmu (jeśli dostępny) */}
              {alert.movie_plot && alert.movie_plot !== 'N/A' && (
                <div className="text-xs text-black mt-2 italic">
                  {alert.movie_plot.length > 150 
                    ? `${alert.movie_plot.substring(0, 150)}...` 
                    : alert.movie_plot}
                </div>
              )}
              
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  alert.status === 'sent' 
                    ? 'bg-green-100 text-green-800' 
                    : alert.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {alert.status === 'sent' ? '✅ Wysłano' : 
                   alert.status === 'failed' ? '❌ Błąd' : '⏳ W trakcie'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
