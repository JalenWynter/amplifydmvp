
// This file contains all client-side functions for interacting with User data.
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth } from "./client";
import type { User, Application } from '../types';

export async function getUsers(): Promise<User[]> {
  console.log("Fetching users from Firestore...");
  try {
    const querySnapshot = await getDocs(query(collection(db, "users"), orderBy("joinedAt", "desc")));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) {
    console.log("Failed to fetch users, returning empty array:", error);
    // Return demo data for emulator mode
    const isEmulatorMode = process.env.NODE_ENV === 'development' && 
                          process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
    
    if (isEmulatorMode) {
      return [
        { id: 'demo1', name: 'Demo User 1', email: 'demo1@test.com', role: 'uploader', status: 'active', joinedAt: new Date().toISOString() },
        { id: 'demo2', name: 'Demo User 2', email: 'demo2@test.com', role: 'reviewer', status: 'active', joinedAt: new Date().toISOString() },
      ] as User[];
    }
    return [];
  }
}

export async function getCurrentUserInfo(): Promise<User | null> {
  console.log("[getCurrentUserInfo] Getting current user info...");
  const user = auth.currentUser;
  if (!user) {
    console.log("[getCurrentUserInfo] No user is currently signed in.");
    return null;
  }

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = { id: userDocSnap.id, ...userDocSnap.data() } as User;
      console.log("[getCurrentUserInfo] User data retrieved:", userData);
      return userData;
    } else {
      console.log("[getCurrentUserInfo] No user document found for UID:", user.uid);
      return null;
    }
  } catch (error) {
    console.error("[getCurrentUserInfo] Error fetching user data:", error);
    return null;
  }
}

export async function approveApplication(applicationId: string): Promise<void> {
  console.log(`Approving application ${applicationId}...`);
  const functions = getFunctions();
  const approveApplicationCallable = httpsCallable(functions, 'approveApplication');
  
  try {
    await approveApplicationCallable({ applicationId });
    console.log(`Application ${applicationId} approved successfully`);
  } catch (error: unknown) {
    console.error("Error approving application:", error);
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
