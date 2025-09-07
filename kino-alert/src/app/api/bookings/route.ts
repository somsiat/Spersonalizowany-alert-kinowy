import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - pobierz rezerwacje użytkownika
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 })
    }

    // Pobierz rezerwacje użytkownika
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        movie_title,
        cinema,
        show_date,
        show_time,
        seats,
        total_price,
        status,
        created_at,
        customer_name,
        customer_email,
        customer_phone
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json({ error: 'Błąd pobierania rezerwacji' }, { status: 500 })
    }

    return NextResponse.json(bookings || [])
  } catch (error) {
    console.error('Error in GET /api/bookings:', error)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

// POST - utwórz nową rezerwację
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 })
    }

    const body = await request.json()
    const {
      movie_id,
      movie_title,
      cinema,
      show_date,
      show_time,
      seats,
      total_price,
      customer_name,
      customer_email,
      customer_phone,
      status = 'confirmed'
    } = body

    // Walidacja danych
    if (!movie_title || !cinema || !show_date || !show_time || !seats || !total_price || 
        !customer_name || !customer_email || !customer_phone) {
      return NextResponse.json({ 
        error: 'Brakujące wymagane pola' 
      }, { status: 400 })
    }

    // Sprawdź czy użytkownik ma profil
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ 
        error: 'Profil użytkownika nie istnieje' 
      }, { status: 400 })
    }

    // Utwórz rezerwację
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id: user.id,
        movie_id: movie_id || null,
        movie_title,
        cinema,
        show_date,
        show_time,
        seats,
        total_price,
        customer_name,
        customer_email,
        customer_phone,
        status,
        booking_reference: `BK${Date.now().toString().slice(-6)}`
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      return NextResponse.json({ 
        error: 'Błąd tworzenia rezerwacji' 
      }, { status: 500 })
    }

    // Wyślij email potwierdzenia (symulacja)
    try {
      await sendBookingConfirmationEmail({
        customerName: customer_name,
        customerEmail: customer_email,
        movieTitle: movie_title,
        cinema,
        showDate: show_date,
        showTime: show_time,
        seats,
        totalPrice: total_price,
        bookingReference: booking.booking_reference
      })
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
      // Nie blokuj rezerwacji jeśli email się nie wyśle
    }

    return NextResponse.json({
      success: true,
      booking,
      message: 'Rezerwacja została utworzona pomyślnie'
    })
  } catch (error) {
    console.error('Error in POST /api/bookings:', error)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

// DELETE - anuluj rezerwację
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 })
    }

    const body = await request.json()
    const { booking_id } = body

    if (!booking_id) {
      return NextResponse.json({ 
        error: 'Brak ID rezerwacji' 
      }, { status: 400 })
    }

    // Sprawdź czy rezerwacja należy do użytkownika
    const { data: existingBooking } = await supabaseAdmin
      .from('bookings')
      .select('id, status, show_date, show_time')
      .eq('id', booking_id)
      .eq('user_id', user.id)
      .single()

    if (!existingBooking) {
      return NextResponse.json({ 
        error: 'Rezerwacja nie została znaleziona' 
      }, { status: 404 })
    }

    // Sprawdź czy można anulować (np. nie później niż 2 godziny przed seansem)
    const showDateTime = new Date(`${existingBooking.show_date}T${existingBooking.show_time}`)
    const now = new Date()
    const hoursUntilShow = (showDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilShow < 2) {
      return NextResponse.json({ 
        error: 'Nie można anulować rezerwacji później niż 2 godziny przed seansem' 
      }, { status: 400 })
    }

    // Anuluj rezerwację
    const { error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking_id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error cancelling booking:', error)
      return NextResponse.json({ 
        error: 'Błąd anulowania rezerwacji' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Rezerwacja została anulowana'
    })
  } catch (error) {
    console.error('Error in DELETE /api/bookings:', error)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

// Funkcja do wysyłania emaila potwierdzenia
async function sendBookingConfirmationEmail(data: {
  customerName: string
  customerEmail: string
  movieTitle: string
  cinema: string
  showDate: string
  showTime: string
  seats: number
  totalPrice: number
  bookingReference: string
}) {
  // W rzeczywistej implementacji używałbyś nodemailer lub innej biblioteki
  console.log('📧 Sending booking confirmation email:', {
    to: data.customerEmail,
    subject: `Potwierdzenie rezerwacji - ${data.movieTitle}`,
    bookingReference: data.bookingReference
  })

  // Symulacja wysyłania emaila
  return Promise.resolve()
}
