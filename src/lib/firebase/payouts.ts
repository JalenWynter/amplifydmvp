
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
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Payout : null;
}

export async function createPayout(payoutData: Omit<Payout, 'id' | 'date' | 'status' | 'amount'> & { amountInCents: number }): Promise<void> {
  console.log("Creating payout via cloud function...");
  const functions = getFirebaseFunctions();
  const createPayoutCallable = httpsCallable(functions, 'createPayout');

  try {
    await createPayoutCallable(payoutData);
    console.log("Payout created successfully");
  } catch (error: unknown) {
    console.error("Error creating payout:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to create payout: ${errorMessage}`);
  }
}

export async function updatePayoutStatus(payoutId: string, status: 'Pending' | 'Paid'): Promise<void> {
  console.log(`Updating payout ${payoutId} status to ${status}...`);
  const functions = getFirebaseFunctions();
  const updatePayoutStatusCallable = httpsCallable(functions, 'updatePayoutStatus');

  try {
    await updatePayoutStatusCallable({ payoutId, status });
    console.log(`Payout ${payoutId} status updated successfully`);
  } catch (error: unknown) {
    console.error("Error updating payout status:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to update payout status: ${errorMessage}`);
  }
}
