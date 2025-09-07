'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AuthFormProps {
  onAuthSuccess: (user: any) => void
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        onAuthSuccess(data.user)
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (error) throw error
        
        if (data.user) {
          onAuthSuccess(data.user)
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold gradient-text-hero mb-2">
          {isLogin ? 'Witaj z powrotem!' : 'Dołącz do nas!'}
        </h2>
        <p className="text-gray-400 text-sm sm:text-base">
          {isLogin ? 'Zaloguj się do swojego konta' : 'Utwórz nowe konto'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
            Adres e-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
            placeholder="twoj@email.com"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
            Hasło
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
            placeholder="Twoje hasło"
          />
        </div>
        
        {error && (
          <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-xl">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">❌</span>
              <span className="text-red-400 font-medium text-sm sm:text-base">{error}</span>
            </div>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm sm:text-base">Ładowanie...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>{isLogin ? '🔑' : '✨'}</span>
              <span className="text-sm sm:text-base">{isLogin ? 'Zaloguj się' : 'Zarejestruj się'}</span>
            </div>
          )}
        </button>
      </form>
      
      <div className="mt-6 sm:mt-8 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-gray-400 hover:text-white text-xs sm:text-sm font-medium transition-colors duration-300"
        >
          {isLogin ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
        </button>
      </div>
    </div>
  )
}
