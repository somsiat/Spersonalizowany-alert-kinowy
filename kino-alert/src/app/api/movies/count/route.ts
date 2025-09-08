import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    // Pobierz liczbę filmów w bazie
    const { count, error } = await supabaseAdmin
      .from('movies')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error counting movies:', error);
      return NextResponse.json(
        { error: "Błąd podczas liczenia filmów" },
        { status: 500 }
      );
    }

    // Pobierz również przykładowe filmy
    const { data: sampleMovies } = await supabaseAdmin
      .from('movies')
      .select('id, title, imdb_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      total_movies: count || 0,
      sample_movies: sampleMovies || []
    });

  } catch (error) {
    console.error('Error in movies count API:', error);
    return NextResponse.json(
      { error: "Błąd serwera" },
      { status: 500 }
    );
  }
}
