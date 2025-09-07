import { NextResponse } from "next/server";
import { runNotificationSystem } from "@/lib/notifications";

export async function POST() {
  try {
    const result = await runNotificationSystem();
    
    if (result.success) {
      return NextResponse.json({ message: result.message });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
