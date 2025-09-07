import { NextRequest, NextResponse } from "next/server";
import { fetchMovieData } from "@/lib/omdb";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { imdbId: string } }
) {
  try {
    const { imdbId } = params;

    if (!imdbId) {
      return NextResponse.json(
        { error: "IMDb ID is required" },
        { status: 400 }
      );
    }

    // Sprawdź czy film już istnieje w bazie danych
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    const { data: existingMovie } = await supabaseAdmin
      .from('movies')
      .select('*')
      .eq('imdb_id', imdbId)
      .single();

    if (existingMovie) {
      return NextResponse.json(existingMovie);
    }

    // Pobierz dane z OMDb API
    const movieData = await fetchMovieData(imdbId);

    if (!movieData) {
      console.log(`Movie ${imdbId} not found in OMDb API`);
      return NextResponse.json(
        { error: "Film nie został znaleziony w OMDb API" },
        { status: 404 }
      );
    }

    // Zapisz film do bazy danych
    const { data: newMovie, error } = await supabaseAdmin!
      .from('movies')
      .insert({
        imdb_id: movieData.imdbID,
        title: movieData.Title,
        year: parseInt(movieData.Year) || null,
        genre: movieData.Genre,
        director: movieData.Director,
        actors: movieData.Actors,
        plot: movieData.Plot,
        poster_url: movieData.Poster,
        imdb_rating: parseFloat(movieData.imdbRating) || null,
        runtime: parseInt(movieData.Runtime) || null,
        // Dodatkowe pola z OMDb
        rated: movieData.Rated,
        released: movieData.Released,
        writer: movieData.Writer,
        language: movieData.Language,
        country: movieData.Country,
        awards: movieData.Awards,
        metascore: movieData.Metascore,
        imdb_votes: movieData.imdbVotes,
        dvd: movieData.DVD,
        box_office: movieData.BoxOffice,
        production: movieData.Production,
        website: movieData.Website,
      })
      .select()
      .single();

    // Debug: sprawdź co zwraca API
    console.log('OMDb API Response:', {
      title: movieData.Title,
      director: movieData.Director,
      actors: movieData.Actors,
      imdbRating: movieData.imdbRating,
      poster: movieData.Poster
    });

    if (error) {
      console.error('Error saving movie to database:', error);
      return NextResponse.json(movieData); // Zwróć dane z API nawet jeśli nie udało się zapisać
    }

    return NextResponse.json(newMovie);
  } catch (error) {
    console.error('Error in movies API:', error);
    return NextResponse.json(
      { error: "Błąd serwera" },
      { status: 500 }
    );
  }
}
