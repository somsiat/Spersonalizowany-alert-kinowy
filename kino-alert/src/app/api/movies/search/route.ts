import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/omdb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: "Parametr 'q' (query) jest wymagany" },
        { status: 400 }
      );
    }

    // Sprawdź czy zmienne środowiskowe OMDb są ustawione
    if (!process.env.OMDB_API_KEY || !process.env.OMDB_API_URL) {
      console.error('OMDb API credentials not configured');
      return NextResponse.json(
        { error: "OMDb API nie jest skonfigurowane" },
        { status: 503 }
      );
    }

    // Wyszukaj filmy w OMDb API
    const movies = await searchMovies(query);

    if (movies.length === 0) {
      return NextResponse.json(
        { message: "Nie znaleziono filmów dla podanego zapytania", movies: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      query,
      count: movies.length,
      movies: movies.map(movie => ({
        imdbID: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        type: movie.Type,
        poster: movie.Poster
      }))
    });

  } catch (error) {
    console.error('Error in movie search API:', error);
    return NextResponse.json(
      { error: "Błąd serwera podczas wyszukiwania filmów" },
      { status: 500 }
    );
  }
}
