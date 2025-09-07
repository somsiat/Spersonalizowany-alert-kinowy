import { supabaseAdmin } from './supabase'
import nodemailer from 'nodemailer'

export interface NotificationData {
  userId: string
  movieTitle: string
  cinemaName: string
  showDate: string
  showTime: string
  matchScore: number
  reasons: string[]
}

// Funkcja do wysyłania powiadomień e-mail
export async function sendEmailNotification(data: NotificationData): Promise<boolean> {
  try {
    // Pobierz email użytkownika z bazy danych
    const { data: userData } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('user_id', data.userId)
      .single()

    if (!userData?.email) {
      console.log('❌ No email found for user:', data.userId)
      return false
    }

    // Konfiguracja transporter (Gmail SMTP)
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Twój email Gmail
        pass: process.env.EMAIL_PASS  // Hasło aplikacji Gmail
      }
    })

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userData.email,
      subject: `🎬 Nowy film dla Ciebie: ${data.movieTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎬 Kino Alert</h2>
          <p>Cześć!</p>
          <p>Znaleźliśmy film, który może Ci się spodobać:</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">🎬 ${data.movieTitle}</h3>
            <p><strong>🏢 Kino:</strong> ${data.cinemaName}</p>
            <p><strong>📅 Data:</strong> ${data.showDate}</p>
            <p><strong>🕐 Godzina:</strong> ${data.showTime}</p>
            <p><strong>⭐ Dopasowanie:</strong> ${Math.round(data.matchScore * 100)}%</p>
          </div>
          
          <h4>Powody dopasowania:</h4>
          <ul>
            ${data.reasons.map(reason => `<li>${reason}</li>`).join('')}
          </ul>
          
          <p style="margin-top: 30px;">
            <a href="http://localhost:3000" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Sprawdź w aplikacji
            </a>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            To powiadomienie zostało wysłane przez Kino Alert. 
            Możesz zmienić ustawienia powiadomień w aplikacji.
          </p>
        </div>
      `
    }

    // Wyślij email
    const info = await transporter.sendMail(mailOptions)
    console.log('📧 Email sent successfully:', info.messageId)

    // Zapisz w historii alertów
    await supabaseAdmin
      .from('alerts')
      .insert({
        user_id: data.userId,
        reason: `Email: ${data.movieTitle} - ${data.cinemaName}`
      })

    return true
  } catch (error) {
    console.error('❌ Error sending email notification:', error)
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
      .from('alerts')
      .insert({
        user_id: data.userId,
        reason: `Push: ${data.movieTitle} - ${data.cinemaName}`
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
