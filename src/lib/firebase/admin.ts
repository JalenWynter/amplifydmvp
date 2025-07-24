// This file contains client-side functions for Admin-specific data fetching and operations.
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "./client";
import type { DashboardStats, ActivityEvent } from '../types';

// Helper to get document count from a collection (used by getDashboardStats)
async function getCollectionCount(collectionName: string): Promise<number> {
    try {
        const snapshot = await getDocs(collection(db, collectionName)); // Note: getCountFromServer is a callable function in backend
        return snapshot.size; // Client-side count, might be less efficient for large collections
    } catch (error) {
        console.error(`Error getting client-side count for ${collectionName}:`, error);
        return 0;
    }
}

export async function getDashboardStats(): Promise<DashboardStats> {
    console.log("Fetching dashboard stats...");
    // For accurate counts, especially for large collections, these should ideally be callable functions
    // that use getCountFromServer on the backend.
    const [totalUsers, totalReviewers, totalSubmissions, completedReviews] = await Promise.all([
        getCollectionCount("users"),
        getCollectionCount("reviewers"),
        getCollectionCount("submissions"),
        // Assuming a callable function for completed reviews count exists or will be created
        // For now, a client-side count of all reviews
        getCollectionCount("reviews"),
    ]);
    return { totalUsers, totalReviewers, totalSubmissions, completedReviews };
}

export async function getRecentActivityEvents(limitCount: number = 10): Promise<ActivityEvent[]> {
    console.log(`Fetching ${limitCount} recent activity events...`);
    const eventsCol = collection(db, "activityEvents");
    const q = query(eventsCol, orderBy("timestamp", "desc"), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as ActivityEvent));
}