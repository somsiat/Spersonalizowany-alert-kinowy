'use client';

import { useState } from 'react';

interface BulkAddResult {
  total: number;
  added: number;
  skipped: number;
  errors: number;
  details: Array<{
    imdbId: string;
    status: 'added' | 'skipped' | 'error';
    title?: string;
    error?: string;
  }>;
}

interface MovieCountResponse {
  total_movies: number;
  sample_movies: Array<{
    id: number;
    title: string;
    imdb_id: string;
    created_at: string;
  }>;
}

export default function BulkMovieAdd() {
  const [imdbIds, setImdbIds] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkAddResult | null>(null);
  const [movieCount, setMovieCount] = useState<MovieCountResponse | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  const loadMovieCount = async () => {
    setLoadingCount(true);
    try {
      const response = await fetch('/api/movies/count');
      const data: MovieCountResponse = await response.json();
      setMovieCount(data);
    } catch (error) {
      console.error('Error loading movie count:', error);
    } finally {
      setLoadingCount(false);
    }
  };

  const addMoviesBulk = async () => {
    if (!imdbIds.trim()) {
      alert('Wprowadź listę IMDb ID');
      return;
    }

    const idList = imdbIds
      .split('\n')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (idList.length === 0) {
      alert('Nie znaleziono prawidłowych IMDb ID');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/movies/bulk-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imdbIds: idList }),
      });

      const data: BulkAddResult = await response.json();
      setResult(data);

      if (data.added > 0) {
        // Odśwież liczbę filmów po dodaniu
        loadMovieCount();
        // Odśwież stronę główną po 3 sekundach
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('Error adding movies:', error);
      alert('Błąd podczas dodawania filmów');
    } finally {
      setLoading(false);
    }
  };

  const popularMovies = [
    'tt0111161', // The Shawshank Redemption
    'tt0068646', // The Godfather
    'tt0071562', // The Godfather Part II
    'tt0468569', // The Dark Knight
    'tt0050083', // 12 Angry Men
    'tt0108052', // Schindler's List
    'tt0167260', // The Lord of the Rings: The Return of the King
    'tt0110912', // Pulp Fiction
    'tt0120737', // The Lord of the Rings: The Fellowship of the Ring
    'tt0060196', // The Good, the Bad and the Ugly
    'tt0109830', // Forrest Gump
    'tt0137523', // Fight Club
    'tt0167261', // The Lord of the Rings: The Two Towers
    'tt0080684', // Star Wars: Episode V - The Empire Strikes Back
    'tt0073486', // One Flew Over the Cuckoo's Nest
    'tt0099685', // Goodfellas
    'tt0047478', // Seven Samurai
    'tt0114369', // Se7en
    'tt0102926', // The Silence of the Lambs
    'tt0317248', // City of God
  ];

  const addPopularMovies = () => {
    setImdbIds(popularMovies.join('\n'));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        📊 Masowe dodawanie filmów
      </h2>

      {/* Liczba filmów w bazie */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-800">Filmy w bazie danych</h3>
            {movieCount ? (
              <p className="text-2xl font-bold text-blue-600">
                {movieCount.total_movies} filmów
              </p>
            ) : (
              <p className="text-gray-600">Kliknij "Sprawdź" aby zobaczyć liczbę</p>
            )}
          </div>
          <button
            onClick={loadMovieCount}
            disabled={loadingCount}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingCount ? 'Sprawdzam...' : 'Sprawdź'}
          </button>
        </div>

        {movieCount && movieCount.sample_movies.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-blue-800 mb-2">Ostatnio dodane filmy:</h4>
            <div className="space-y-1">
              {movieCount.sample_movies.slice(0, 5).map((movie) => (
                <div key={movie.id} className="text-sm text-blue-700">
                  • {movie.title} ({movie.imdb_id})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Masowe dodawanie */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lista IMDb ID (jeden na linię):
          </label>
          <textarea
            value={imdbIds}
            onChange={(e) => setImdbIds(e.target.value)}
            placeholder="tt0111161&#10;tt0068646&#10;tt0071562&#10;..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={addMoviesBulk}
            disabled={loading || !imdbIds.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Dodaję filmy...' : 'Dodaj filmy'}
          </button>

          <button
            onClick={addPopularMovies}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Dodaj popularne filmy
          </button>
        </div>
      </div>

      {/* Wyniki */}
      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Wyniki dodawania:</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{result.total}</div>
              <div className="text-sm text-gray-600">Łącznie</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{result.added}</div>
              <div className="text-sm text-gray-600">Dodane</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
              <div className="text-sm text-gray-600">Pominięte</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{result.errors}</div>
              <div className="text-sm text-gray-600">Błędy</div>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            <h4 className="font-medium text-gray-700 mb-2">Szczegóły:</h4>
            <div className="space-y-1">
              {result.details.map((detail, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${
                    detail.status === 'added' ? 'bg-green-500' :
                    detail.status === 'skipped' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="font-mono text-gray-600">{detail.imdbId}</span>
                  <span className="text-gray-800">
                    {detail.title || detail.error}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instrukcje */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">💡 Jak to działa:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Wprowadź IMDb ID filmów (jeden na linię)</li>
          <li>• Kliknij "Dodaj filmy" aby dodać wszystkie na raz</li>
          <li>• System automatycznie pobierze pełne metadane z OMDb API</li>
          <li>• Filmy już istniejące w bazie zostaną pominięte</li>
          <li>• Możesz dodać maksymalnie 100 filmów na raz</li>
        </ul>
      </div>
    </div>
  );
}
