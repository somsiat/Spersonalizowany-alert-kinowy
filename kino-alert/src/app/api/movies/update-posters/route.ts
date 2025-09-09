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

    // Znajdź filmy bez plakatów lub z nieprawidłowymi plakatami (pomiń temp_ ID)
    const { data: moviesWithoutPosters, error: fetchError } = await supabaseAdmin
      .from('movies')
      .select('id, title, imdb_id')
      .or('poster_url.is.null,poster_url.eq.N/A,poster_url.like.%example.com%')
      .not('imdb_id', 'is', null)
      .not('imdb_id', 'like', 'temp_%');

    if (fetchError) {
      console.error('Error fetching movies without posters:', fetchError);
      return NextResponse.json(
        { error: "Błąd podczas pobierania filmów" },
        { status: 500 }
      );
    }

    if (!moviesWithoutPosters || moviesWithoutPosters.length === 0) {
      return NextResponse.json({
        message: "Wszystkie filmy już mają plakaty!",
        updated: 0,
        total: 0
      });
    }

    console.log(`🎬 Found ${moviesWithoutPosters.length} movies without posters`);

    const results = {
      total: moviesWithoutPosters.length,
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
    for (const movie of moviesWithoutPosters) {
      try {
        console.log(`🎬 Updating poster for: ${movie.title} (${movie.imdb_id})`);

        // Pobierz dane z OMDb API
        const movieData = await fetchMovieData(movie.imdb_id);

        if (!movieData) {
          results.errors++;
          results.details.push({
            id: movie.id,
            title: movie.title,
            imdb_id: movie.imdb_id,
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
            imdb_id: movie.imdb_id,
            status: 'error',
            error: 'OMDb API nie zwrócił prawidłowego plakatu'
          });
          continue;
        }

        // Zaktualizuj film w bazie danych
        const { error: updateError } = await supabaseAdmin
          .from('movies')
          .update({
            poster_url: movieData.Poster,
            // Zaktualizuj też inne dane jeśli są puste
            genre: movie.genre || movieData.Genre,
            director: movie.director || movieData.Director,
            actors: movie.actors || movieData.Actors,
            imdb_rating: movie.imdb_rating || parseFloat(movieData.imdbRating) || null,
          })
          .eq('id', movie.id);

        if (updateError) {
          console.error(`Error updating movie ${movie.id}:`, updateError);
          results.errors++;
          results.details.push({
            id: movie.id,
            title: movie.title,
            imdb_id: movie.imdb_id,
            status: 'error',
            error: updateError.message
          });
        } else {
          results.updated++;
          results.details.push({
            id: movie.id,
            title: movie.title,
            imdb_id: movie.imdb_id,
            status: 'updated',
            newPoster: movieData.Poster
          });
          console.log(`✅ Updated poster for: ${movie.title}`);
        }

        // Dodaj małe opóźnienie między requestami do OMDb API
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error processing movie ${movie.id}:`, error);
        results.errors++;
        results.details.push({
          id: movie.id,
          title: movie.title,
          imdb_id: movie.imdb_id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in update posters API:', error);
    return NextResponse.json(
      { error: "Błąd serwera" },
      { status: 500 }
    );
  }
}
