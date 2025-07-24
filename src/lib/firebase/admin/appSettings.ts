import { doc, getDoc } from "firebase/firestore";
import { db } from "../client";
import { AppSettings } from '../../types';

export async function getAppSettingsAdmin(): Promise<AppSettings> {
    const settingsRef = doc(db, "settings", "app-config");
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
    } else {
        // Default settings if none exist
        // This should ideally be set up in Firestore directly by an admin
        // or during initial deployment.
        return { applicationMode: 'open' }; // Default to open for now
    }
}
