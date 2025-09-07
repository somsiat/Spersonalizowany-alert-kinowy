import { NextResponse } from "next/server";
import { runScraping } from "@/lib/scrapers";

export async function POST() {
  try {
    const result = await runScraping();
    
    if (result.success) {
      return NextResponse.json({ message: result.message });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in scrape API:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
