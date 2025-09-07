import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting matches GET request');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ No authorization header');
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token received, validating user...');
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('📊 Fetching matches for user:', user.id);

    // Najpierw spróbuj prostego zapytania bez JOIN
    const { data, error } = await supabaseAdmin
      .from('user_matches')
      .select('*')
      .eq('user_id', user.id)
      .order('match_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Error fetching matches:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch matches', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Matches fetched successfully:', data?.length || 0, 'matches');

    // Jeśli nie ma dopasowań, zwróć pustą tablicę
    if (!data || data.length === 0) {
      console.log('ℹ️ No matches found for user');
      return NextResponse.json([]);
    }

    // Teraz pobierz szczegóły filmów, seansów i kin
    const enrichedMatches = await Promise.all(data.map(async (match) => {
      try {
        // Pobierz dane filmu
        const { data: movie } = await supabaseAdmin
          .from('movies')
          .select('title, poster_url, imdb_rating, genre, director, actors')
          .eq('id', match.movie_id)
          .single();

        // Pobierz dane seansu
        const { data: showtime } = await supabaseAdmin
          .from('showtimes')
          .select('show_date, show_time, hall, price, available_seats, cinema_id')
          .eq('id', match.showtime_id)
          .single();

        // Pobierz dane kina
        let cinema = null;
        if (showtime?.cinema_id) {
          const { data: cinemaData } = await supabaseAdmin
            .from('cinemas')
            .select('name, city, address')
            .eq('id', showtime.cinema_id)
            .single();
          cinema = cinemaData;
        }

        return {
          ...match,
          movies: movie,
          showtimes: showtime,
          cinemas: cinema
        };
      } catch (err) {
        console.error('Error enriching match:', err);
        return match;
      }
    }));

    return NextResponse.json(enrichedMatches);
  } catch (error) {
    console.error('❌ Error in matches GET:', error);
    return NextResponse.json({ 
      error: 'Błąd serwera', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

    const body = await request.json();
    const { movie_id, showtime_id, match_score } = body;

    const { data, error } = await supabaseAdmin
      .from('user_matches')
      .insert({
        user_id: user.id,
        movie_id,
        showtime_id,
        match_score,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating match:', error);
      return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in matches POST:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
