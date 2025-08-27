import { NextResponse } from 'next/server';
import { AppSettings } from '@/lib/types';

export async function GET() {
  try {
    // For emulator environment, return default settings
    // In production, this would use Firebase Admin SDK
    const appSettings: AppSettings = {
      applicationMode: 'open',
      maintenanceMode: false,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedFileTypes: ['mp3', 'wav', 'aiff', 'm4a'],
      reviewTurnaroundTime: '3-5 days'
    };
    
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
