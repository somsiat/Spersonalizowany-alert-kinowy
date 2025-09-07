import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting alerts GET request');
    
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

    // Najpierw spróbuj prostego zapytania bez JOIN
    console.log('📊 Fetching alerts for user:', user.id);
    
    const { data: alerts, error } = await supabaseAdmin
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Error fetching alerts:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch alerts', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Alerts fetched successfully:', alerts?.length || 0, 'alerts');

    // Jeśli nie ma alertów, zwróć pustą tablicę
    if (!alerts || alerts.length === 0) {
      console.log('ℹ️ No alerts found for user');
      return NextResponse.json([]);
    }

    // Teraz pobierz szczegóły seansów i kin
    const enrichedAlerts = await Promise.all(alerts.map(async (alert) => {
      try {
        let showtime = null;
        let cinema = null;

        // Pobierz dane seansu jeśli showtime_id istnieje
        if (alert.showtime_id) {
          const { data: showtimeData } = await supabaseAdmin
            .from('showtimes')
            .select('show_date, show_time, cinema_id, movie_id')
            .eq('id', alert.showtime_id)
            .single();
          showtime = showtimeData;

          // Pobierz dane kina
          if (showtime?.cinema_id) {
            const { data: cinemaData } = await supabaseAdmin
              .from('cinemas')
              .select('name, city')
              .eq('id', showtime.cinema_id)
              .single();
            cinema = cinemaData;
          }

          // Pobierz dane filmu jeśli movie_id istnieje w showtime
          if (showtime?.movie_id) {
            const { data: movieData } = await supabaseAdmin
              .from('movies')
              .select('title, year, poster_url')
              .eq('id', showtime.movie_id)
              .single();
            showtime.movie = movieData;
          }
        }

        return {
          ...alert,
          showtimes: showtime ? {
            ...showtime,
            cinemas: cinema
          } : null
        };
      } catch (err) {
        console.error('Error enriching alert:', err);
        return alert;
      }
    }));

    return NextResponse.json(enrichedAlerts);
  } catch (error) {
    console.error('❌ Error in alerts GET:', error);
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
    const { 
      movie_id, 
      showtime_id, 
      alert_type,
      reason
    } = body;

    // Sprawdź czy alert już istnieje
    const { data: existingAlert } = await supabaseAdmin
      .from('alerts')
      .select('id')
      .eq('user_id', user.id)
      .eq('showtime_id', showtime_id)
      .single();

    if (existingAlert) {
      return NextResponse.json({ 
        message: 'Alert już istnieje',
        alert: existingAlert 
      });
    }

    // Utwórz nowy alert
    const { data: newAlert, error } = await supabaseAdmin
      .from('alerts')
      .insert({
        user_id: user.id,
        showtime_id,
        reason: reason || `Alert dla filmu ${movie_id || 'nieznany'}`
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating alert:', error);
      return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Alert utworzony pomyślnie',
      alert: newAlert
    });

  } catch (error) {
    console.error('Error in alerts POST:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const { alert_id } = body;

    if (!alert_id) {
      return NextResponse.json({ error: 'Brak alert_id' }, { status: 400 });
    }

    // Usuń alert o danym ID
    const { error } = await supabaseAdmin
      .from('alerts')
      .delete()
      .eq('user_id', user.id)
      .eq('id', alert_id);

    if (error) {
      console.error('Error deleting alert:', error);
      return NextResponse.json({ error: 'Błąd usuwania alertu' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Alert usunięty pomyślnie'
    });

  } catch (error) {
    console.error('Error in alerts DELETE:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
