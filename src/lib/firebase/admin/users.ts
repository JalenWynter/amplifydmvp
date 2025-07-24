
// This file contains client-side functions for Admin-specific User management.
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../client";
import type { User } from '../../types';

export async function getUsers(): Promise<User[]> {
  console.log("Fetching users from Firestore...");
  const querySnapshot = await getDocs(query(collection(db, "users"), orderBy("joinedAt", "desc")));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

export async function updateUserRole(userId: string, newRole: User['role']): Promise<{ success: boolean, error?: string }> {
    const functions = getFunctions();
    const updateRoleCallable = httpsCallable(functions, 'updateUserRole');
    try {
        const result = await updateRoleCallable({ userId, newRole });
        console.log(`User ${userId} role updated to ${newRole}`);
        return result.data as { success: boolean, error?: string };
    } catch (error: unknown) {
        console.error("Error updating user role:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        return { success: false, error: errorMessage };
    }
}

export async function updateUserStatus(userId: string, newStatus: User['status']): Promise<{ success: boolean, error?: string }> {
    const functions = getFunctions();
    const updateStatusCallable = httpsCallable(functions, 'updateUserStatus');
    try {
        const result = await updateStatusCallable({ userId, newStatus });
        console.log(`User ${userId} status updated to ${newStatus}`);
        return result.data as { success: boolean, error?: string };
    } catch (error: unknown) {
        console.error("Error updating user status:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        return { success: false, error: errorMessage };
    }
}
