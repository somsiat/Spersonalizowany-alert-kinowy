'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TicketBookingProps {
  movie: {
    id?: string
    imdbId?: string
    title: string
    year?: number
    poster_url?: string
    showtimes?: Array<{
      cinema: string
      time: string
      price: number
      hall?: string
      available_seats?: number
    }>
  }
  onClose: () => void
}

interface BookingData {
  movieTitle: string
  cinema: string
  showTime: string
  date: string
  seats: number
  totalPrice: number
  customerName: string
  customerEmail: string
  customerPhone: string
}

export default function TicketBooking({ movie, onClose }: TicketBookingProps) {
  const [selectedShowtime, setSelectedShowtime] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSeats, setSelectedSeats] = useState(1)
  const [bookingData, setBookingData] = useState<BookingData>({
    movieTitle: movie.title,
    cinema: '',
    showTime: '',
    date: '',
    seats: 1,
    totalPrice: 0,
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [step, setStep] = useState(1) // 1: Wybór seansu, 2: Dane osobowe, 3: Płatność, 4: Potwierdzenie

  // Generuj dostępne daty (następne 7 dni)
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date.toISOString().split('T')[0]
  })

  const handleShowtimeSelect = (showtime: any) => {
    setSelectedShowtime(showtime)
    setBookingData(prev => ({
      ...prev,
      cinema: showtime.cinema,
      showTime: showtime.time,
      totalPrice: showtime.price * selectedSeats
    }))
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setBookingData(prev => ({
      ...prev,
      date: date
    }))
  }

  const handleSeatsChange = (seats: number) => {
    setSelectedSeats(seats)
    if (selectedShowtime) {
      setBookingData(prev => ({
        ...prev,
        seats: seats,
        totalPrice: selectedShowtime.price * seats
      }))
    }
  }

  const handleInputChange = (field: keyof BookingData, value: string) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBooking = async () => {
    if (!selectedShowtime || !selectedDate) {
      setMessage({type: 'error', text: 'Proszę wybrać seans i datę'})
      return
    }

    if (step === 2) {
      if (!bookingData.customerName || !bookingData.customerEmail || !bookingData.customerPhone) {
        setMessage({type: 'error', text: 'Proszę wypełnić wszystkie pola'})
        return
      }
      setStep(3)
      return
    }

    if (step === 3) {
      setLoading(true)
      try {
        // Symulacja płatności
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Zapisz rezerwację do bazy danych
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              movie_id: movie.id || movie.imdbId,
              movie_title: movie.title,
              cinema: bookingData.cinema,
              show_date: bookingData.date,
              show_time: bookingData.showTime,
              seats: bookingData.seats,
              total_price: bookingData.totalPrice,
              customer_name: bookingData.customerName,
              customer_email: bookingData.customerEmail,
              customer_phone: bookingData.customerPhone,
              status: 'confirmed'
            })
          })

          if (response.ok) {
            setStep(4)
            setMessage({type: 'success', text: 'Rezerwacja została potwierdzona!'})
          } else {
            throw new Error('Błąd podczas rezerwacji')
          }
        } else {
          throw new Error('Musisz być zalogowany, aby zarezerwować bilet')
        }
      } catch (error) {
        setMessage({type: 'error', text: 'Błąd podczas rezerwacji. Spróbuj ponownie.'})
      } finally {
        setLoading(false)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">🎫 Rezerwacja biletów</h2>
            <button
              onClick={onClose}
              className="text-black hover:text-black text-2xl"
            >
              ✕
            </button>
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

          {/* Informacje o filmie */}
          <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
            {movie.poster_url && movie.poster_url !== 'N/A' ? (
              <img 
                src={movie.poster_url} 
                alt={movie.title}
                className="w-16 h-24 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-2xl">🎬</span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-black">{movie.title}</h3>
              {movie.year && <p className="text-black">{movie.year}</p>}
            </div>
          </div>

          {/* Krok 1: Wybór seansu */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-black">1. Wybierz seans</h3>
              
              {/* Wybór daty */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Data seansu</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableDates.map(date => (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className={`p-3 rounded-lg border text-sm ${
                        selectedDate === date
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-black border-gray-300 hover:border-indigo-500'
                      }`}
                    >
                      {formatDate(date)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wybór seansu */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Godzina seansu</label>
                  <div className="space-y-2">
                    {movie.showtimes?.map((showtime, index) => (
                      <button
                        key={index}
                        onClick={() => handleShowtimeSelect(showtime)}
                        className={`w-full p-4 rounded-lg border text-left ${
                          selectedShowtime === showtime
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-black border-gray-300 hover:border-indigo-500'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{showtime.cinema}</div>
                            <div className="text-sm opacity-75">{showtime.time}</div>
                            {showtime.hall && <div className="text-sm opacity-75">Sala: {showtime.hall}</div>}
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{showtime.price} zł</div>
                            {showtime.available_seats && (
                              <div className="text-sm opacity-75">{showtime.available_seats} miejsc</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wybór liczby miejsc */}
              {selectedShowtime && (
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Liczba miejsc</label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleSeatsChange(Math.max(1, selectedSeats - 1))}
                      className="w-10 h-10 rounded-full bg-gray-200 text-black flex items-center justify-center hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="text-lg font-medium text-black">{selectedSeats}</span>
                    <button
                      onClick={() => handleSeatsChange(Math.min(10, selectedSeats + 1))}
                      className="w-10 h-10 rounded-full bg-gray-200 text-black flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Podsumowanie */}
              {selectedShowtime && selectedDate && (
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <h4 className="font-semibold text-black mb-2">Podsumowanie</h4>
                  <div className="space-y-1 text-sm text-black">
                    <div>Film: {movie.title}</div>
                    <div>Kino: {selectedShowtime.cinema}</div>
                    <div>Data: {formatDate(selectedDate)}</div>
                    <div>Godzina: {selectedShowtime.time}</div>
                    <div>Miejsca: {selectedSeats}</div>
                    <div className="font-bold text-lg">Cena: {bookingData.totalPrice} zł</div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!selectedShowtime || !selectedDate}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Dalej
              </button>
            </div>
          )}

          {/* Krok 2: Dane osobowe */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-black">2. Dane osobowe</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Imię i nazwisko *</label>
                  <input
                    type="text"
                    value={bookingData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Jan Kowalski"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Email *</label>
                  <input
                    type="email"
                    value={bookingData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="jan@example.com"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-2">Telefon *</label>
                  <input
                    type="tel"
                    value={bookingData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="123 456 789"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-black py-3 px-6 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Wstecz
                </button>
                <button
                  onClick={handleBooking}
                  className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 font-semibold"
                >
                  Dalej
                </button>
              </div>
            </div>
          )}

          {/* Krok 3: Płatność */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-black">3. Płatność</h3>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-black mb-2">💳 Symulacja płatności</h4>
                <p className="text-black text-sm">
                  To jest symulacja systemu płatności. W rzeczywistej aplikacji 
                  zintegrowalibyśmy się z systemem płatności takim jak Stripe, PayPal lub Przelewy24.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-black mb-2">Podsumowanie płatności</h4>
                <div className="space-y-2 text-sm text-black">
                  <div className="flex justify-between">
                    <span>Bilety ({selectedSeats} x {selectedShowtime?.price} zł):</span>
                    <span>{selectedSeats * (selectedShowtime?.price || 0)} zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Opłata serwisowa:</span>
                    <span>2,50 zł</span>
                  </div>
                  <hr className="border-gray-300" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Do zapłaty:</span>
                    <span>{bookingData.totalPrice + 2.50} zł</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-black py-3 px-6 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Wstecz
                </button>
                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                >
                  {loading ? 'Przetwarzanie...' : 'Zapłać'}
                </button>
              </div>
            </div>
          )}

          {/* Krok 4: Potwierdzenie */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="text-6xl">🎉</div>
              <h3 className="text-2xl font-bold text-black">Rezerwacja potwierdzona!</h3>
              
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-black mb-4">Szczegóły rezerwacji</h4>
                <div className="space-y-2 text-sm text-black text-left">
                  <div><strong>Numer rezerwacji:</strong> #BK{Date.now().toString().slice(-6)}</div>
                  <div><strong>Film:</strong> {movie.title}</div>
                  <div><strong>Kino:</strong> {bookingData.cinema}</div>
                  <div><strong>Data:</strong> {formatDate(bookingData.date)}</div>
                  <div><strong>Godzina:</strong> {bookingData.showTime}</div>
                  <div><strong>Miejsca:</strong> {bookingData.seats}</div>
                  <div><strong>Klient:</strong> {bookingData.customerName}</div>
                  <div><strong>Email:</strong> {bookingData.customerEmail}</div>
                  <div><strong>Telefon:</strong> {bookingData.customerPhone}</div>
                  <div><strong>Kwota:</strong> {bookingData.totalPrice + 2.50} zł</div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-black text-sm">
                  📧 Potwierdzenie zostało wysłane na adres: <strong>{bookingData.customerEmail}</strong>
                </p>
                <p className="text-black text-sm mt-2">
                  🎫 Bilety można odebrać w kasie kina 30 minut przed seansem.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 font-semibold"
              >
                Zamknij
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
