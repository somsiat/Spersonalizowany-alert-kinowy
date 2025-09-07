import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cinemaId = searchParams.get('cinema_id');
    const movieId = searchParams.get('movie_id');
    const date = searchParams.get('date');

    let query = supabaseAdmin
      .from('showtimes')
      .select(`
        *,
        cinemas(name, city),
        movies(title, poster_url, imdb_rating)
      `);

    if (cinemaId) {
      query = query.eq('cinema_id', cinemaId);
    }

    if (movieId) {
      query = query.eq('movie_id', movieId);
    }

    if (date) {
      query = query.eq('show_date', date);
    } else {
      // Domyślnie pokazuj seanse z dzisiejszego dnia i przyszłe
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('show_date', today);
    }

    const { data, error } = await query.order('show_date').order('show_time');

    if (error) {
      console.error('Error fetching showtimes:', error);
      return NextResponse.json({ error: 'Failed to fetch showtimes' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in showtimes GET:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
