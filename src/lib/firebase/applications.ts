
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "./client";

// This file contains client-side functions for interacting with Application data.
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "./client";
import type { Application } from '../types';

export async function addApplication(
    applicationData: Omit<Application, 'id' | 'status' | 'submittedAt'>
): Promise<{ success: boolean, message: string }> {
    console.log("Calling submitApplication Cloud Function...");
    const functions = getFirebaseFunctions();
    const submitApplicationCallable = httpsCallable(functions, 'submitApplication');

    try {
        const result = await submitApplicationCallable(applicationData);
        return result.data as { success: boolean, message: string };
    } catch (error: unknown) {
        console.error("Error calling submitApplication Cloud Function:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to submit application: ${errorMessage}`);
    }
}

export async function getApplications(): Promise<Application[]> {
    const q = query(collection(db, "applications"), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
}

export async function getApplicationById(id: string): Promise<Application | null> {
    const docRef = doc(db, "applications", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Application : null;
}

export async function rejectApplication(id: string): Promise<void> {
    const reject = httpsCallable(getFirebaseFunctions(), 'rejectApplication');
    await reject({ applicationId: id });
}
