import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('cinemas')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching cinemas:', error);
      return NextResponse.json({ error: 'Failed to fetch cinemas' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in cinemas GET:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
