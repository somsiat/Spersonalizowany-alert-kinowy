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

    // Znajdź Spider-Man film z temp_ ID
    const { data: spidermanMovie, error: fetchError } = await supabaseAdmin
      .from('movies')
      .select('id, title, imdb_id')
      .eq('title', 'Spider-Man: Across the Spider-Verse')
      .like('imdb_id', 'temp_%')
      .single();

    if (fetchError || !spidermanMovie) {
      return NextResponse.json({
        message: "Spider-Man film z temp_ ID nie został znaleziony",
        found: false
      });
    }

    console.log(`🎬 Found Spider-Man movie to fix: ${spidermanMovie.title} (ID: ${spidermanMovie.id})`);

    // Pobierz dane z OMDb API
    const movieData = await fetchMovieData('tt9362722');

    if (!movieData) {
      return NextResponse.json({
        error: "Nie można pobrać danych Spider-Man z OMDb API"
      }, { status: 500 });
    }

    // Sprawdź czy plakat jest prawidłowy
    const hasValidPoster = movieData.Poster && 
                          movieData.Poster !== 'N/A' && 
                          movieData.Poster.startsWith('http');

    if (!hasValidPoster) {
      return NextResponse.json({
        error: "OMDb API nie zwrócił prawidłowego plakatu dla Spider-Man"
      }, { status: 500 });
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
      .eq('id', spidermanMovie.id);

    if (updateError) {
      console.error(`Error updating Spider-Man movie:`, updateError);
      return NextResponse.json({
        error: "Błąd podczas aktualizacji Spider-Man w bazie danych",
        details: updateError.message
      }, { status: 500 });
    }

    console.log(`✅ Fixed Spider-Man movie: ${spidermanMovie.title}`);

    return NextResponse.json({
      success: true,
      message: "Spider-Man film został pomyślnie naprawiony!",
      movie: {
        id: spidermanMovie.id,
        title: spidermanMovie.title,
        newImdbId: movieData.imdbID,
        newPoster: movieData.Poster
      }
    });

  } catch (error) {
    console.error('Error in fix Spider-Man API:', error);
    return NextResponse.json(
      { error: "Błąd serwera" },
      { status: 500 }
    );
  }
}
