
// This file contains all client-side functions for interacting with User data.
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth } from "./client";
import type { User, Application } from '../types';

export async function getUsers(): Promise<User[]> {
  console.log("Fetching users from Firestore...");
  const querySnapshot = await getDocs(query(collection(db, "users"), orderBy("joinedAt", "desc")));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

export async function getCurrentUserInfo(): Promise<User | null> {
  console.log("[getCurrentUserInfo] Getting current user info...");
  
  if (!auth.currentUser) {
    console.log("[getCurrentUserInfo] No authenticated user.");
    return null;
  }
  
  console.log(`[getCurrentUserInfo] Authenticated user UID: ${auth.currentUser.uid}`);
  const userRef = doc(db, "users", auth.currentUser.uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    console.log(`[getCurrentUserInfo] No user document found for UID: ${auth.currentUser.uid}`);
    return null;
  }
  
  const userData = { id: userDoc.id, ...userDoc.data() } as User;
  console.log("[getCurrentUserInfo] User document found:", userData);
  return userData;
}

export async function approveApplication(applicationId: string): Promise<{ success: boolean, message: string }> {
    console.log(`Invoking 'approveApplication' cloud function for application: ${applicationId}`);

    try {
        const functions = getFunctions(); // Get Firebase Functions instance
        const approveApplicationCallable = httpsCallable(functions, 'approveApplication');
        
        const result = await approveApplicationCallable({ applicationId });

        console.log("✅ Application approved successfully.", result.data);
        return result.data as { success: boolean, message: string };

    } catch (error: unknown) {
        console.error("Error calling 'approveApplication' cloud function:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to approve application: ${errorMessage}`);
    }
}

export async function rejectApplication(applicationId: string): Promise<{ success: boolean, message: string }> {
    console.log(`Invoking 'rejectApplication' cloud function for application: ${applicationId}`);

    try {
        const functions = getFunctions();
        const rejectApplicationCallable = httpsCallable(functions, 'rejectApplication');

        const result = await rejectApplicationCallable({ applicationId });

        console.log("✅ Application rejected successfully.", result.data);
        return result.data as { success: boolean, message: string };

    } catch (error: unknown) {
        console.error("Error calling 'rejectApplication' cloud function:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to reject application: ${errorMessage}`);
    }
}
