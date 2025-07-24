
// This file contains client-side functions for interacting with Payout data.
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "./client";
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";
import { db } from "./client";
import type { Payout } from '../types';

export async function getPayouts(): Promise<Payout[]> {
  console.log("Fetching payouts from Firestore...");
  const querySnapshot = await getDocs(query(collection(db, "payouts"), orderBy("date", "desc")));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payout));
}

export async function getPayoutById(id: string): Promise<Payout | null> {
  console.log(`Fetching payout ${id} from Firestore...`);
  const docRef = doc(db, "payouts", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Payout;
  }
  return null;
}

export async function createPayout(payoutData: Omit<Payout, 'id' | 'date' | 'status' | 'amount'> & { amountInCents: number }): Promise<{ success: boolean, id: string, message: string }> {
    console.log("Calling createPayout Cloud Function...");
    const functions = getFirebaseFunctions();
    const createPayoutCallable = httpsCallable(functions, 'createPayout');

    try {
        const result = await createPayoutCallable(payoutData);
        return result.data as { success: boolean, id: string, message: string };
    } catch (error: unknown) {
        console.error("Error calling createPayout Cloud Function:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to create payout: ${errorMessage}`);
    }
}

export async function updatePayoutStatus(payoutId: string, status: Payout['status']): Promise<{ success: boolean, message: string }> {
    console.log(`Calling updatePayoutStatus Cloud Function for payout ${payoutId} to status ${status}`);
    const functions = getFirebaseFunctions();
    const updatePayoutStatusCallable = httpsCallable(functions, 'updatePayoutStatus');

    try {
        const result = await updatePayoutStatusCallable({ payoutId, status });
        return result.data as { success: boolean, message: string };
    } catch (error: unknown) {
        console.error("Error calling updatePayoutStatus Cloud Function:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to update payout status: ${errorMessage}`);
    }
}
