
// This file contains client-side functions for Admin-specific User management.
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "../client";
import { User, UserRole } from "../../types";

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

export async function updateUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> {
  console.log(`Updating user ${userId} role to ${newRole}`);
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role: newRole });
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateUserStatus(userId: string, newStatus: 'active' | 'suspended'): Promise<{ success: boolean; error?: string }> {
  console.log(`Updating user ${userId} status to ${newStatus}`);
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { status: newStatus });
    return { success: true };
  } catch (error) {
    console.error("Error updating user status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
