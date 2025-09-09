'use client';

import { useState } from 'react';

interface UpdatePostersResult {
  total: number;
  updated: number;
  errors: number;
  details: Array<{
    id: number;
    title: string;
    imdb_id: string;
    status: 'updated' | 'error';
    error?: string;
    newPoster?: string;
  }>;
}

export default function UpdatePosters() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UpdatePostersResult | null>(null);

  const updatePosters = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/movies/update-posters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: UpdatePostersResult = await response.json();
      setResult(data);

      if (data.updated > 0) {
        // Odśwież stronę główną po 3 sekundach
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating posters:', error);
      alert('Błąd podczas aktualizacji plakatów');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🖼️ Aktualizacja plakatów filmów
      </h2>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Co robi ta funkcja:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Znajduje filmy bez plakatów lub z nieprawidłowymi plakatami</li>
          <li>• Pobiera prawidłowe plakaty z OMDb API</li>
          <li>• Aktualizuje filmy w bazie danych</li>
          <li>• Odświeża stronę główną po zakończeniu</li>
        </ul>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={updatePosters}
          disabled={loading}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Aktualizuję plakaty...' : 'Aktualizuj plakaty'}
        </button>
      </div>

      {/* Wyniki */}
      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Wyniki aktualizacji:</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{result.total}</div>
              <div className="text-sm text-gray-600">Znaleziono</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{result.updated}</div>
              <div className="text-sm text-gray-600">Zaktualizowane</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{result.errors}</div>
              <div className="text-sm text-gray-600">Błędy</div>
            </div>
          </div>

          {result.details.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <h4 className="font-medium text-gray-700 mb-2">Szczegóły:</h4>
              <div className="space-y-1">
                {result.details.map((detail, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${
                      detail.status === 'updated' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-mono text-gray-600">{detail.imdb_id}</span>
                    <span className="text-gray-800 flex-1">
                      {detail.title}
                    </span>
                    {detail.status === 'updated' && (
                      <span className="text-green-600 text-xs">✅ Zaktualizowano</span>
                    )}
                    {detail.status === 'error' && (
                      <span className="text-red-600 text-xs">❌ {detail.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instrukcje */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">💡 Jak to działa:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• System automatycznie znajdzie filmy bez plakatów</li>
          <li>• Pobierze prawidłowe plakaty z OMDb API</li>
          <li>• Zaktualizuje filmy w bazie danych</li>
          <li>• Strona główna odświeży się automatycznie</li>
        </ul>
      </div>
    </div>
  );
}
