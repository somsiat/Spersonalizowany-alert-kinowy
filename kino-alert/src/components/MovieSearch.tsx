'use client';

import { useState } from 'react';

interface MovieSearchResult {
  imdbID: string;
  title: string;
  year: string;
  type: string;
  poster: string;
}

interface MovieSearchResponse {
  query: string;
  count: number;
  movies: MovieSearchResult[];
}

export default function MovieSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const searchMovies = async () => {
    if (!query.trim()) {
      setMessage('Wprowadź tytuł filmu do wyszukania');
      return;
    }

    setLoading(true);
    setMessage('');
    setResults([]);

    try {
      const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
      const data: MovieSearchResponse = await response.json();

      if (response.ok) {
        setResults(data.movies);
        if (data.movies.length === 0) {
          setMessage('Nie znaleziono filmów dla podanego zapytania');
        }
      } else {
        setMessage(data.error || 'Błąd podczas wyszukiwania filmów');
      }
    } catch (error) {
      console.error('Error searching movies:', error);
      setMessage('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  const addMovieToDatabase = async (imdbId: string, title: string) => {
    try {
      const response = await fetch(`/api/movies/${imdbId}`);
      
      if (response.ok) {
        setMessage(`✅ Film "${title}" został pomyślnie dodany do bazy danych!`);
        // Usuń film z wyników po dodaniu
        setResults(prev => prev.filter(movie => movie.imdbID !== imdbId));
        // Odśwież stronę główną po 2 sekundach
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage(`❌ Błąd podczas dodawania filmu: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding movie:', error);
      setMessage('❌ Błąd połączenia z serwerem');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🔍 Wyszukaj i dodaj filmy
      </h2>
      
      {/* Wyszukiwarka */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Wprowadź tytuł filmu..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onKeyPress={(e) => e.key === 'Enter' && searchMovies()}
        />
        <button
          onClick={searchMovies}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Szukam...' : 'Szukaj'}
        </button>
      </div>

      {/* Komunikat */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.includes('✅') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : message.includes('❌')
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {message}
        </div>
      )}

      {/* Wyniki wyszukiwania */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Znalezione filmy ({results.length}):
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((movie) => (
              <div key={movie.imdbID} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Plakat */}
                  <div className="flex-shrink-0">
                    {movie.poster && movie.poster !== 'N/A' ? (
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-16 h-24 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Brak plakatu</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Informacje o filmie */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 truncate">
                      {movie.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {movie.year} • {movie.type}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      IMDb ID: {movie.imdbID}
                    </p>
                    
                    <button
                      onClick={() => addMovieToDatabase(movie.imdbID, movie.title)}
                      className="mt-3 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      ➕ Dodaj do bazy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instrukcje */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">💡 Jak to działa:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Wprowadź tytuł filmu i kliknij "Szukaj"</li>
          <li>• System wyszuka filmy w bazie OMDb</li>
          <li>• Kliknij "Dodaj do bazy" przy wybranym filmie</li>
          <li>• Film zostanie dodany z pełnymi metadanymi (reżyser, aktorzy, ocena IMDb, itp.)</li>
        </ul>
      </div>
    </div>
  );
}
