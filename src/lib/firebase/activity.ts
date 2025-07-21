import { collection, addDoc } from "firebase/firestore";
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
