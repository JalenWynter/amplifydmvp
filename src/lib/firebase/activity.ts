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
        console.error("Error fetching recent activity events:", error);
        return [];
    }
}
