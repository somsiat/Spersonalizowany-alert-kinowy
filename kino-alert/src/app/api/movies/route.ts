import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    console.log('🎬 Movies API called');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const genre = searchParams.get('genre');
    const search = searchParams.get('search');

    console.log('🎬 Request params:', { limit, offset, genre, search });

    // Sprawdź konfigurację Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase configuration missing');
      return NextResponse.json(
        { 
          error: "Konfiguracja bazy danych nie jest ustawiona. Sprawdź plik .env.local",
          details: "Brakuje NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY"
        },
        { status: 503 }
      );
    }

    console.log('🎬 Supabase config OK');

    if (!supabaseAdmin) {
      console.error('supabaseAdmin is null');
      return NextResponse.json(
        { 
          error: "Database connection error",
          details: "supabaseAdmin is null - check server-side configuration"
        },
        { status: 500 }
      );
    }

    console.log('🎬 supabaseAdmin OK, testing table...');

    // Najpierw sprawdź czy tabela istnieje i ma dane
    const { data: testData, error: testError } = await supabaseAdmin
      .from('movies')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Database table error:', testError);
      return NextResponse.json(
        { 
          error: "Błąd tabeli movies",
          details: testError.message,
          code: testError.code,
          hint: testError.hint
        },
        { status: 500 }
      );
    }

    console.log('🎬 Table test OK, found', testData?.length || 0, 'records');

    let query = supabaseAdmin
      .from('movies')
      .select('*')
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrowanie po gatunku
    if (genre && genre !== 'all') {
      query = query.ilike('genre', `%${genre}%`);
    }

    // Wyszukiwanie po tytule
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: movies, error } = await query;

    if (error) {
      console.error('Error fetching movies:', error);
      return NextResponse.json(
        { error: "Błąd podczas pobierania filmów" },
        { status: 500 }
      );
    }

    // Pobierz również liczbę wszystkich filmów (dla paginacji)
    let countQuery = supabaseAdmin
      .from('movies')
      .select('*', { count: 'exact', head: true });

    if (genre && genre !== 'all') {
      countQuery = countQuery.ilike('genre', `%${genre}%`);
    }

    if (search) {
      countQuery = countQuery.ilike('title', `%${search}%`);
    }

    const { count } = await countQuery;

    // Dodaj przykładowe seanse dla każdego filmu (symulacja)
    const moviesWithShowtimes = movies?.map(movie => ({
      ...movie,
      showtimes: [
        {
          cinema: 'Helios Rzeszów',
          time: `${Math.floor(Math.random() * 6) + 16}:${Math.random() > 0.5 ? '00' : '30'}`,
          price: Math.floor(Math.random() * 10) + 20
        },
        {
          cinema: 'Multikino Rzeszów',
          time: `${Math.floor(Math.random() * 6) + 16}:${Math.random() > 0.5 ? '00' : '30'}`,
          price: Math.floor(Math.random() * 10) + 20
        },
        {
          cinema: 'Cinema City Rzeszów',
          time: `${Math.floor(Math.random() * 6) + 16}:${Math.random() > 0.5 ? '00' : '30'}`,
          price: Math.floor(Math.random() * 10) + 20
        }
      ]
    })) || [];

    return NextResponse.json({
      movies: moviesWithShowtimes,
      total: count || 0,
      limit,
      offset,
      hasMore: (offset + limit) < (count || 0)
    });

  } catch (error) {
    console.error('Error in movies API:', error);
    return NextResponse.json(
      { error: "Błąd serwera" },
      { status: 500 }
    );
  }
}
