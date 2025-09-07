import { supabaseAdmin } from './supabase'

export interface NotificationData {
  userId: string
  movieTitle: string
  cinemaName: string
  showDate: string
  showTime: string
  matchScore: number
  reasons: string[]
}

// Funkcja do wysyłania powiadomień e-mail (symulacja)
export async function sendEmailNotification(data: NotificationData): Promise<boolean> {
  try {
    // W rzeczywistej implementacji używałbyś usługi jak SendGrid, Mailgun, itp.
    console.log('📧 Email notification sent:', {
      to: data.userId,
      subject: `🎬 Nowy film dla Ciebie: ${data.movieTitle}`,
      body: `
        Cześć!
        
        Znaleźliśmy film, który może Ci się spodobać:
        
        🎬 ${data.movieTitle}
        🏢 ${data.cinemaName}
        📅 ${data.showDate} o ${data.showTime}
        ⭐ Dopasowanie: ${Math.round(data.matchScore * 100)}%
        
        Powody dopasowania:
        ${data.reasons.map(reason => `• ${reason}`).join('\n')}
        
        Sprawdź szczegóły w aplikacji!
      `
    })

    // Zapisz w historii alertów
    await supabaseAdmin
      .from('alert_history')
      .insert({
        user_id: data.userId,
        alert_type: 'email',
        status: 'sent'
      })

    return true
  } catch (error) {
    console.error('Error sending email notification:', error)
    return false
  }
}

// Funkcja do wysyłania powiadomień push (symulacja)
export async function sendPushNotification(data: NotificationData): Promise<boolean> {
  try {
    // W rzeczywistej implementacji używałbyś Web Push API lub FCM
    console.log('🔔 Push notification sent:', {
      userId: data.userId,
      title: `🎬 ${data.movieTitle}`,
      body: `${data.cinemaName} - ${data.showDate} ${data.showTime}`,
      data: {
        movieTitle: data.movieTitle,
        cinemaName: data.cinemaName,
        showDate: data.showDate,
        showTime: data.showTime
      }
    })

    // Zapisz w historii alertów
    await supabaseAdmin
      .from('alert_history')
      .insert({
        user_id: data.userId,
        alert_type: 'push',
        status: 'sent'
      })

    return true
  } catch (error) {
    console.error('Error sending push notification:', error)
    return false
  }
}

// Funkcja do wysyłania powiadomień dla nowych dopasowań
export async function sendNotificationsForNewMatches(): Promise<void> {
  try {
    // Pobierz nowe dopasowania, które nie zostały jeszcze powiadomione
    const { data: newMatches } = await supabaseAdmin
      .from('user_matches')
      .select(`
        id,
        user_id,
        match_score,
        movies(title),
        showtimes(show_date, show_time),
        cinemas(name)
      `)
      .eq('is_notified', false)
      .order('created_at', { ascending: false })

    if (!newMatches || newMatches.length === 0) {
      console.log('No new matches to notify about')
      return
    }

    for (const match of newMatches) {
      if (!match.movies || !match.showtimes || !match.cinemas) continue

      // Pobierz preferencje użytkownika
      const { data: preferences } = await supabaseAdmin
        .from('user_prefs')
        .select('email_notifications, push_notifications')
        .eq('user_id', match.user_id)
        .single()

      if (!preferences) continue

      const notificationData: NotificationData = {
        userId: match.user_id,
        movieTitle: match.movies.title,
        cinemaName: match.cinemas.name,
        showDate: match.showtimes.show_date,
        showTime: match.showtimes.show_time,
        matchScore: match.match_score,
        reasons: [] // W rzeczywistej implementacji pobierałbyś powody z bazy
      }

      let notificationSent = false

      // Wyślij powiadomienie e-mail jeśli włączone
      if (preferences.email_notifications) {
        const emailSent = await sendEmailNotification(notificationData)
        if (emailSent) notificationSent = true
      }

      // Wyślij powiadomienie push jeśli włączone
      if (preferences.push_notifications) {
        const pushSent = await sendPushNotification(notificationData)
        if (pushSent) notificationSent = true
      }

      // Oznacz jako powiadomione jeśli wysłano jakiekolwiek powiadomienie
      if (notificationSent) {
        await supabaseAdmin
          .from('user_matches')
          .update({ is_notified: true })
          .eq('id', match.id)
      }
    }

    console.log(`Processed notifications for ${newMatches.length} new matches`)
  } catch (error) {
    console.error('Error sending notifications for new matches:', error)
  }
}

// Funkcja do uruchamiania systemu powiadomień
export async function runNotificationSystem(): Promise<{ success: boolean; message: string }> {
  try {
    await sendNotificationsForNewMatches()
    return { success: true, message: 'Notifications processed successfully' }
  } catch (error) {
    console.error('Error in notification system:', error)
    return { success: false, message: 'Notification system failed' }
  }
}
