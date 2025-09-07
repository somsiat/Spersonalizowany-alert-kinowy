import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });
    }

    // Pobierz oceny użytkownika
    const { data: ratings, error } = await supabaseAdmin
      .from('user_ratings')
      .select(`
        *,
        movies (
          title,
          year,
          poster_url,
          imdb_rating
        )
      `)
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false });

    if (error) {
      console.error('Error fetching ratings:', error);
      return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }

    return NextResponse.json(ratings);

  } catch (error) {
    console.error('Error in ratings GET:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });
    }

    const { movie_id, rating } = await request.json();

    if (!movie_id || !rating || rating < 1 || rating > 10) {
      return NextResponse.json({ 
        error: 'Nieprawidłowe dane - movie_id i rating (1-10) są wymagane' 
      }, { status: 400 });
    }

    // Sprawdź czy ocena już istnieje
    const { data: existingRating } = await supabaseAdmin
      .from('user_ratings')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', movie_id)
      .single();

    let result;
    if (existingRating) {
      // Aktualizuj istniejącą ocenę
      const { data, error } = await supabaseAdmin
        .from('user_ratings')
        .update({ 
          rating,
          watched_at: new Date().toISOString()
        })
        .eq('id', existingRating.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating rating:', error);
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
      }

      result = { message: 'Ocena zaktualizowana', rating: data };
    } else {
      // Utwórz nową ocenę
      const { data, error } = await supabaseAdmin
        .from('user_ratings')
        .insert({
          user_id: user.id,
          movie_id,
          rating,
          watched_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating rating:', error);
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
      }

      result = { message: 'Ocena dodana', rating: data };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in ratings POST:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
