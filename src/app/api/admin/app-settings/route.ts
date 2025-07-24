import { NextResponse } from 'next/server';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AppSettings } from '@/lib/types';

export async function GET() {
  try {
    const settingsRef = doc(db, "settings", "app-config");
    const docSnap = await getDoc(settingsRef);
    
    let appSettings: AppSettings;
    if (docSnap.exists()) {
      appSettings = docSnap.data() as AppSettings;
    } else {
      // Default settings if none exist
      appSettings = { applicationMode: 'open' }; // Default to open for now
    }
    return NextResponse.json(appSettings);
  } catch (error: unknown) {
    console.error("Error fetching app settings:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = (error as { message: string }).message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
