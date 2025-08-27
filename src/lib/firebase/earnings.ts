// This file contains client-side functions for interacting with Earnings data.
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "./client";
import type { Earnings } from '../types';

// Update reviewer earnings (Admin only)
export async function updateReviewerEarnings(
  reviewerId: string, 
  amount: number, 
  reviewId: string, 
  type: string = 'review_completion'
): Promise<{ success: boolean; earningsId: string; amount: number; reviewerId: string; reviewId: string }> {
  console.log("Updating reviewer earnings via cloud function...");
  const functions = getFirebaseFunctions();
  const updateEarningsCallable = httpsCallable(functions, 'updateReviewerEarnings');
  
  try {
    const result = await updateEarningsCallable({ reviewerId, amount, reviewId, type });
    return result.data;
  } catch (error: unknown) {
    console.error("Error updating reviewer earnings:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to update reviewer earnings: ${errorMessage}`);
  }
}

// Get earnings for a reviewer
export async function getReviewerEarnings(reviewerId: string): Promise<Earnings[]> {
  console.log(`Fetching earnings for reviewer ${reviewerId}...`);
  // This would typically use a cloud function, but for now we'll use direct Firestore
  // TODO: Create getReviewerEarnings cloud function
  throw new Error("getReviewerEarnings not yet implemented - use direct Firestore for now");
}

// Get all earnings (Admin only)
export async function getAllEarnings(): Promise<Earnings[]> {
  console.log("Fetching all earnings...");
  // This would typically use a cloud function, but for now we'll use direct Firestore
  // TODO: Create getAllEarnings cloud function
  throw new Error("getAllEarnings not yet implemented - use direct Firestore for now");
}
