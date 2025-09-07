import { NextResponse } from "next/server";
import { runMatchingForAllUsers } from "@/lib/matching";

export async function POST() {
  try {
    await runMatchingForAllUsers();
    return NextResponse.json({ message: 'Dopasowanie zakończone pomyślnie' });
  } catch (error) {
    console.error('Error in matching API:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
