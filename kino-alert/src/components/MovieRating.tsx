'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface MovieRatingProps {
  movieId: string
  movieTitle: string
  currentRating?: number
  onRatingChange?: (rating: number) => void
}

export default function MovieRating({ 
  movieId, 
  movieTitle, 
  currentRating = 0, 
  onRatingChange 
}: MovieRatingProps) {
  const [rating, setRating] = useState(currentRating)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleRating = async (newRating: number) => {
    setLoading(true)
    setMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage('Musisz być zalogowany, aby ocenić film')
        return
      }

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          movie_id: movieId,
          rating: newRating
        })
      })

      const data = await response.json()

      if (response.ok) {
        setRating(newRating)
        setMessage(data.message)
        onRatingChange?.(newRating)
      } else {
        setMessage(data.error || 'Błąd podczas zapisywania oceny')
      }
    } catch (error) {
      setMessage('Błąd połączenia')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = () => {
    return Array.from({ length: 10 }, (_, i) => {
      const starValue = i + 1
      const isFilled = starValue <= rating
      const isHalf = starValue === rating + 0.5

      return (
        <button
          key={i}
          onClick={() => handleRating(starValue)}
          disabled={loading}
          className={`text-2xl transition-colors ${
            isFilled 
              ? 'text-yellow-400 hover:text-yellow-500' 
              : 'text-gray-300 hover:text-yellow-400'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={`Oceń na ${starValue}/10`}
        >
          {isFilled ? '★' : '☆'}
        </button>
      )
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h4 className="text-lg font-semibold text-slate-800 mb-3">
        ⭐ Oceń film: {movieTitle}
      </h4>
      
      <div className="flex items-center space-x-2 mb-3">
        {renderStars()}
        <span className="text-sm text-black ml-2">
          {rating > 0 ? `${rating}/10` : 'Nie oceniono'}
        </span>
      </div>

      {message && (
        <div className={`text-sm p-2 rounded ${
          message.includes('Błąd') || message.includes('Musisz')
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <div className="text-xs text-black mt-2">
        💡 Twoja ocena pomoże w lepszym dopasowywaniu filmów do Twoich preferencji
      </div>
    </div>
  )
}
