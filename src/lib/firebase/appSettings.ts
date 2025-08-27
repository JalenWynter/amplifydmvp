import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./client";
import { AppSettings } from "../types";

let cachedSettings: AppSettings | null = null;

export async function getAppSettings(): Promise<AppSettings> {
  if (cachedSettings) {
    return cachedSettings;
  }
  
  try {
    const settingsRef = doc(db, "settings", "app-config");
    const docSnap = await getDoc(settingsRef);
    
    if (docSnap.exists()) {
      const settings = docSnap.data() as AppSettings;
      cachedSettings = settings;
      return settings;
    } else {
      // Default settings if none exist
      const defaultSettings: AppSettings = { applicationMode: 'invite-only' };
      await setDoc(settingsRef, defaultSettings);
      cachedSettings = defaultSettings;
      return defaultSettings;
    }
  } catch (error) {
    console.log("Failed to fetch app settings, returning defaults:", error);
    // Return demo data for emulator mode
    const isEmulatorMode = process.env.NODE_ENV === 'development' && 
                          process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
    
    if (isEmulatorMode) {
      return { applicationMode: 'invite-only' };
    }
    return { applicationMode: 'invite-only' };
  }
}

export async function updateAppSettings(newSettings: Partial<AppSettings>): Promise<void> {
  const settingsRef = doc(db, "settings", "app-config");
  await updateDoc(settingsRef, newSettings);
  cachedSettings = null; // Invalidate cache
}
