'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Booking {
  id: string
  movie_title: string
  cinema: string
  show_date: string
  show_time: string
  seats: number
  total_price: number
  status: 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  customer_name: string
  customer_email: string
  customer_phone: string
  booking_reference?: string
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Nie jesteś zalogowany')
        return
      }

      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Nie udało się pobrać rezerwacji')
      }

      const data = await response.json()
      setBookings(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const cancelBooking = async (bookingId: string) => {
    try {
      setCancellingBooking(bookingId)
      setMessage(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage({type: 'error', text: 'Nie jesteś zalogowany'})
        return
      }

      const response = await fetch('/api/bookings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ booking_id: bookingId })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({type: 'success', text: data.message})
        // Odśwież listę rezerwacji
        fetchBookings()
      } else {
        setMessage({type: 'error', text: data.error || 'Błąd anulowania rezerwacji'})
      }
    } catch (error) {
      setMessage({type: 'error', text: 'Błąd połączenia'})
    } finally {
      setCancellingBooking(null)
      // Ukryj komunikat po 3 sekundach
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '✅ Potwierdzona'
      case 'cancelled':
        return '❌ Anulowana'
      case 'completed':
        return '🎬 Zakończona'
      default:
        return status
    }
  }

  const canCancelBooking = (booking: Booking) => {
    if (booking.status !== 'confirmed') return false
    
    const showDateTime = new Date(`${booking.show_date}T${booking.show_time}`)
    const now = new Date()
    const hoursUntilShow = (showDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    return hoursUntilShow >= 2
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
        <p className="text-black">Ładowanie rezerwacji...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchBookings}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Spróbuj ponownie
        </button>
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-black mb-4">
          <span className="text-4xl mb-2 block">🎫</span>
          Brak rezerwacji
        </div>
        <p className="text-black mb-6">
          Twoje rezerwacje biletów będą wyświetlane tutaj.
        </p>
        <p className="text-sm text-black">
          💡 Kliknij przycisk "Zarezerwuj bilet" przy filmie, aby utworzyć pierwszą rezerwację.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-black">
          🎫 Historia rezerwacji ({bookings.length})
        </h3>
      </div>

      {/* Komunikat */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {message.type === 'success' ? '✅' : '❌'}
            </span>
            <span>{message.text}</span>
          </div>
        </div>
      )}
      
      {bookings.map((booking) => (
        <div key={booking.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-semibold text-black text-lg">
                  {booking.movie_title}
                </h4>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-black">
                <div>
                  <div><strong>🏢 Kino:</strong> {booking.cinema}</div>
                  <div><strong>📅 Data:</strong> {formatDate(booking.show_date)}</div>
                  <div><strong>🕐 Godzina:</strong> {formatTime(booking.show_time)}</div>
                </div>
                <div>
                  <div><strong>🎫 Miejsca:</strong> {booking.seats}</div>
                  <div><strong>💰 Cena:</strong> {booking.total_price} zł</div>
                  {booking.booking_reference && (
                    <div><strong>🔢 Numer:</strong> {booking.booking_reference}</div>
                  )}
                </div>
              </div>
              
              <div className="mt-3 text-xs text-black">
                <div><strong>👤 Klient:</strong> {booking.customer_name}</div>
                <div><strong>📧 Email:</strong> {booking.customer_email}</div>
                <div><strong>📱 Telefon:</strong> {booking.customer_phone}</div>
                <div><strong>📅 Zarezerwowano:</strong> {formatDate(booking.created_at)}</div>
              </div>
            </div>
            
            {/* Przycisk anulowania */}
            {canCancelBooking(booking) && (
              <button
                onClick={() => cancelBooking(booking.id)}
                disabled={cancellingBooking === booking.id}
                className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancellingBooking === booking.id ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  'Anuluj'
                )}
              </button>
            )}
          </div>
          
          {/* Informacje o anulowaniu */}
          {!canCancelBooking(booking) && booking.status === 'confirmed' && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-black">
              ⚠️ Nie można anulować rezerwacji później niż 2 godziny przed seansem
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
