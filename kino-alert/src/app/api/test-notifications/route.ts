import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmailNotification, sendPushNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing notifications...');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });
    }

    // Pobierz preferencje użytkownika
    const { data: preferences } = await supabaseAdmin
      .from('user_prefs')
      .select('email_notifications, push_notifications')
      .eq('user_id', user.id)
      .single();

    if (!preferences) {
      return NextResponse.json({ error: 'Brak preferencji użytkownika' }, { status: 404 });
    }

    const testData = {
      userId: user.id,
      movieTitle: 'Test Film - Oppenheimer',
      cinemaName: 'Helios Rzeszów',
      showDate: '2024-01-15',
      showTime: '20:00',
      matchScore: 0.85,
      reasons: ['Gatunek: Drama', 'Ocena IMDb: 8.5/10', 'Reżyser: Christopher Nolan']
    };

    const results = {
      email: false,
      push: false,
      preferences: preferences
    };

    // Test powiadomienia email
    if (preferences.email_notifications) {
      console.log('📧 Testing email notification...');
      results.email = await sendEmailNotification(testData);
    }

    // Test powiadomienia push
    if (preferences.push_notifications) {
      console.log('🔔 Testing push notification...');
      results.push = await sendPushNotification(testData);
    }

    // Dodaj testowy wpis do historii alertów
    await supabaseAdmin
      .from('alerts')
      .insert({
        user_id: user.id,
        reason: 'Test powiadomień - Oppenheimer'
      });

    console.log('✅ Notification test completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Test powiadomień zakończony pomyślnie',
      results: results,
      testData: testData
    });

  } catch (error) {
    console.error('❌ Error testing notifications:', error);
    return NextResponse.json({ 
      error: 'Błąd testowania powiadomień', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
