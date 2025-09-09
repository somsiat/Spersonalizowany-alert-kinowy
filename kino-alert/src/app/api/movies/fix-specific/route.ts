import { NextResponse } from "next/server";
import { fetchMovieData } from "@/lib/omdb";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    // Sprawdź czy zmienne środowiskowe OMDb są ustawione
    if (!process.env.OMDB_API_KEY || !process.env.OMDB_API_URL) {
      return NextResponse.json(
        { error: "OMDb API nie jest skonfigurowane" },
        { status: 503 }
      );
    }

    // Lista filmów do naprawienia z ich prawdziwymi IMDb ID
    const moviesToFix = [
      { id: 1, title: "Avengers: Endgame", imdbId: "tt4154796" },
      { id: 2, title: "Dune", imdbId: "tt1160419" }
    ];

    const results = {
      total: moviesToFix.length,
      updated: 0,
      errors: 0,
      details: [] as Array<{
        id: number;
        title: string;
        imdb_id: string;
        status: 'updated' | 'error';
        error?: string;
        newPoster?: string;
      }>
    };

    // Zaktualizuj każdy film
    for (const movie of moviesToFix) {
      try {
        console.log(`🎬 Fixing movie: ${movie.title} (${movie.imdbId})`);

        // Pobierz dane z OMDb API
        const movieData = await fetchMovieData(movie.imdbId);

        if (!movieData) {
          results.errors++;
          results.details.push({
            id: movie.id,
            title: movie.title,
            imdb_id: movie.imdbId,
            status: 'error',
            error: 'Film nie został znaleziony w OMDb API'
          });
          continue;
        }

        // Sprawdź czy plakat jest prawidłowy
        const hasValidPoster = movieData.Poster && 
                              movieData.Poster !== 'N/A' && 
                              movieData.Poster.startsWith('http');

        if (!hasValidPoster) {
          results.errors++;
          results.details.push({
            id: movie.id,
            title: movie.title,
            imdb_id: movie.imdbId,
            status: 'error',
            error: 'OMDb API nie zwrócił prawidłowego plakatu'
          });
          continue;
        }

        // Zaktualizuj film w bazie danych
        const { error: updateError } = await supabaseAdmin
          .from('movies')
          .update({
            imdb_id: movieData.imdbID,
            poster_url: movieData.Poster,
            genre: movieData.Genre,
            director: movieData.Director,
            actors: movieData.Actors,
            imdb_rating: parseFloat(movieData.imdbRating) || null,
          })
          .eq('id', movie.id);

        if (updateError) {
          console.error(`Error updating movie ${movie.id}:`, updateError);
          results.errors++;
          results.details.push({
            id: movie.id,
            title: movie.title,
            imdb_id: movie.imdbId,
            status: 'error',
            error: updateError.message
          });
        } else {
          results.updated++;
          results.details.push({
            id: movie.id,
            title: movie.title,
            imdb_id: movie.imdbId,
            status: 'updated',
            newPoster: movieData.Poster
          });
          console.log(`✅ Fixed movie: ${movie.title}`);
        }

        // Dodaj małe opóźnienie między requestami do OMDb API
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error processing movie ${movie.id}:`, error);
        results.errors++;
        results.details.push({
          id: movie.id,
          title: movie.title,
          imdb_id: movie.imdbId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in fix specific movies API:', error);
    return NextResponse.json(
      { error: "Błąd serwera" },
      { status: 500 }
    );
  }
}
