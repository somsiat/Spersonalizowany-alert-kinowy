import { NextRequest, NextResponse } from "next/server";
import { fetchMovieData } from "@/lib/omdb";
import { supabaseAdmin } from "@/lib/supabase";

interface BulkAddRequest {
  imdbIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkAddRequest = await request.json();
    const { imdbIds } = body;

    if (!imdbIds || !Array.isArray(imdbIds) || imdbIds.length === 0) {
      return NextResponse.json(
        { error: "Lista IMDb ID jest wymagana" },
        { status: 400 }
      );
    }

    if (imdbIds.length > 100) {
      return NextResponse.json(
        { error: "Maksymalnie 100 filmów na raz" },
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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    const results = {
      total: imdbIds.length,
      added: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        imdbId: string;
        status: 'added' | 'skipped' | 'error';
        title?: string;
        error?: string;
      }>
    };

    // Przetwórz każdy film
    for (const imdbId of imdbIds) {
      try {
        // Sprawdź czy film już istnieje
        const { data: existingMovie } = await supabaseAdmin
          .from('movies')
          .select('id, title')
          .eq('imdb_id', imdbId)
          .single();

        if (existingMovie) {
          results.skipped++;
          results.details.push({
            imdbId,
            status: 'skipped',
            title: existingMovie.title
          });
          continue;
        }

        // Pobierz dane z OMDb API
        const movieData = await fetchMovieData(imdbId);

        if (!movieData) {
          results.errors++;
          results.details.push({
            imdbId,
            status: 'error',
            error: 'Film nie został znaleziony w OMDb API'
          });
          continue;
        }

        // Debug: sprawdź plakat
        console.log(`🎬 Movie ${imdbId} poster:`, {
          title: movieData.Title,
          poster: movieData.Poster,
          posterValid: movieData.Poster && movieData.Poster !== 'N/A' && movieData.Poster.startsWith('http')
        });

        // Zapisz film do bazy danych
        const { data: newMovie, error } = await supabaseAdmin
          .from('movies')
          .insert({
            imdb_id: movieData.imdbID,
            title: movieData.Title,
            genre: movieData.Genre,
            director: movieData.Director,
            actors: movieData.Actors,
            poster_url: movieData.Poster,
            imdb_rating: parseFloat(movieData.imdbRating) || null,
          })
          .select()
          .single();

        if (error) {
          console.error(`Error saving movie ${imdbId}:`, error);
          results.errors++;
          results.details.push({
            imdbId,
            status: 'error',
            error: error.message
          });
        } else {
          results.added++;
          results.details.push({
            imdbId,
            status: 'added',
            title: movieData.Title
          });
        }

        // Dodaj małe opóźnienie między requestami do OMDb API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing movie ${imdbId}:`, error);
        results.errors++;
        results.details.push({
          imdbId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in bulk add movies API:', error);
    return NextResponse.json(
      { error: "Błąd serwera" },
      { status: 500 }
    );
  }
}
