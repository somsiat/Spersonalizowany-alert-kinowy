import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmailNotification, sendPushNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Sending notifications...');
    
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
      userId,
      movieTitle,
      movieYear,
      movieGenre,
      movieDirector,
      movieImdbRating,
      moviePosterUrl,
      moviePlot,
      alertType,
      emailEnabled,
      pushEnabled
    } = body;

    const results = {
      email: false,
      push: false
    };

    // Przygotuj dane powiadomienia
    const notificationData = {
      userId: userId,
      movieTitle: movieTitle,
      cinemaName: 'Wybrane kino', // Ogólne powiadomienie o filmie
      showDate: new Date().toISOString().split('T')[0],
      showTime: 'Wkrótce',
      matchScore: 1.0,
      reasons: [
        `Gatunek: ${movieGenre}`,
        `Reżyser: ${movieDirector}`,
        `Ocena IMDb: ${movieImdbRating}/10`
      ]
    };

    // Wyślij powiadomienie email jeśli włączone
    if (emailEnabled) {
      console.log('📧 Sending email notification...');
      results.email = await sendEmailNotification(notificationData);
    }

    // Wyślij powiadomienie push jeśli włączone
    if (pushEnabled) {
      console.log('🔔 Sending push notification...');
      results.push = await sendPushNotification(notificationData);
    }

    // Zapisz szczegóły powiadomienia w bazie
    await supabaseAdmin
      .from('alert_history')
      .insert({
        user_id: userId,
        alert_type: alertType,
        status: 'sent',
        movie_title: movieTitle,
        movie_year: movieYear,
        movie_genre: movieGenre,
        movie_director: movieDirector,
        movie_imdb_rating: movieImdbRating,
        movie_poster_url: moviePosterUrl,
        movie_plot: moviePlot
      });

    console.log('✅ Notifications sent:', results);

    return NextResponse.json({
      success: true,
      message: 'Powiadomienia zostały wysłane',
      results: results
    });

  } catch (error) {
    console.error('❌ Error sending notifications:', error);
    return NextResponse.json({ 
      error: 'Błąd wysyłania powiadomień', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
