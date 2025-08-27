import { collection, addDoc, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "./client";
import { ActivityEvent } from "../types";

export async function logActivityEvent(event: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
        const eventWithTimestamp: Omit<ActivityEvent, 'id'> = {
            ...event,
            timestamp: new Date().toISOString(),
        };
        await addDoc(collection(db, "activityEvents"), eventWithTimestamp);
        console.log("Activity event logged:", event.type, event.details);
    } catch (error) {
        console.error("Error logging activity event:", error);
    }
}

export async function getRecentActivityEvents(count: number): Promise<ActivityEvent[]> {
    try {
        const q = query(collection(db, "activityEvents"), orderBy("timestamp", "desc"), limit(count));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityEvent));
    } catch (error) {
        console.log("Failed to fetch activity events, returning demo data:", error);
        // Return demo data for emulator mode
        const isEmulatorMode = process.env.NODE_ENV === 'development' && 
                              process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
        
        if (isEmulatorMode) {
            return [
                {
                    id: 'demo1',
                    type: 'user_registration',
                    timestamp: new Date().toISOString(),
                    userEmail: 'demo@test.com',
                    details: { action: 'User registered' }
                },
                {
                    id: 'demo2',
                    type: 'submission_created',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    userEmail: 'artist@test.com',
                    details: { action: 'Music submission created' }
                }
            ] as ActivityEvent[];
        }
        return [];
    }
}
