
// This file contains all client-side functions for interacting with Reviewer data.
import { collection, getDocs, doc, getDoc, query, orderBy, where } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "./client";
import type { Reviewer, ReviewPackage, Review } from '../types';

// In a real app, this would be memoized or fetched less frequently.
let cachedReviewers: Reviewer[] | null = null;

// Invalidate cache when reviewer data changes
function invalidateReviewerCache() {
    console.log("Reviewer cache invalidated.");
    cachedReviewers = null;
}

export async function getReviewers(): Promise<Reviewer[]> {
    if (cachedReviewers) {
        console.log("Returning cached reviewers...");
        return cachedReviewers;
    }
    console.log("Fetching reviewers from Firestore...");
    const querySnapshot = await getDocs(query(collection(db, "reviewers"), orderBy("name")));
    const reviewers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reviewer));
    cachedReviewers = reviewers;
    return reviewers;
}

export async function getReviewerById(id: string): Promise<Reviewer | null> {
    console.log(`[getReviewerById] Attempting to fetch reviewer with ID: ${id}`);
    const docRef = doc(db, "reviewers", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const reviewerData = { id: docSnap.id, ...docSnap.data() } as Reviewer;
        console.log(`[getReviewerById] Reviewer found:`, reviewerData);
        return reviewerData;
    } else {
        console.log(`[getReviewerById] No reviewer document found for ID: ${id}`);
        return null;
    }
}

export async function updateReviewerProfile(reviewerId: string, data: Partial<Pick<Reviewer, 'name' | 'turnaround' | 'experience' | 'genres'>>): Promise<void> {
    const functions = getFunctions();
    const updateProfile = httpsCallable(functions, 'updateReviewerProfile');
    try {
        await updateProfile(data);
        invalidateReviewerCache();
        console.log(`Profile update function called for reviewer ${reviewerId}`);
    } catch (error: unknown) {
        console.error("Error calling updateReviewerProfile Cloud Function:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to update reviewer profile: ${errorMessage}`);
    }
}

export async function addPackage(reviewerId: string, packageData: Omit<ReviewPackage, 'id'>): Promise<ReviewPackage> {
    const functions = getFunctions();
    const addPkg = httpsCallable(functions, 'addPackage');
    try {
        const result = await addPkg(packageData);
        invalidateReviewerCache();
        console.log(`Add package function called for reviewer ${reviewerId}`);
        // The backend function now returns the full package object with the new ID
        return result.data as ReviewPackage;
    } catch (error: unknown) {
        console.error("Error calling addPackage Cloud Function:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to add package: ${errorMessage}`);
    }
}

export async function updatePackage(reviewerId: string, updatedPackage: ReviewPackage): Promise<void> {
    const functions = getFunctions();
    const updatePkg = httpsCallable(functions, 'updatePackage');
    try {
        // Pass the entire package, including its ID, to the backend function
        await updatePkg(updatedPackage);
        invalidateReviewerCache();
        console.log(`Update package function called for package ${updatedPackage.id}`);
    } catch (error: unknown) {
        console.error("Error calling updatePackage Cloud Function:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to update package: ${errorMessage}`);
    }
}

export async function deletePackage(reviewerId: string, packageId: string): Promise<void> {
    const functions = getFunctions();
    const deletePkg = httpsCallable(functions, 'deletePackage');
    try {
        await deletePkg({ packageId });
        invalidateReviewerCache();
        console.log(`Delete package function called for package ${packageId}`);
    } catch (error: unknown) {
        console.error("Error calling deletePackage Cloud Function:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to delete package: ${errorMessage}`);
    }
}

export async function getReviewsByReviewer(reviewerId: string): Promise<Review[]> {
    console.log(`Fetching reviews for reviewer ${reviewerId}...`);
    const reviewsCol = collection(db, "reviews");
    const q = query(reviewsCol, where("reviewerId", "==", reviewerId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Review));
    return reviews;
}
