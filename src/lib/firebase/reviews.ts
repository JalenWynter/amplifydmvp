
// This file contains client-side functions for interacting with Review data.
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, orderBy, where, writeBatch, limit } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, getFirebaseFunctions } from "./client";
import { SUBMISSION_STATUS } from '../constants';
import type { Review, Submission } from '../types';
import { getSubmissionById } from './submissions';
import { Review, ReviewFormValues } from "../types";

export async function submitReview(reviewData: { 
  submissionId: string; 
  scores: Record<string, number>; 
  overallScore: number; 
  strengths: string; 
  improvements: string; 
  summary: string; 
}): Promise<Review> {
  console.log("Submitting review via cloud function...");
  const functions = getFirebaseFunctions();
  const submitReviewCallable = httpsCallable(functions, 'submitReview');
  
  try {
    const result = await submitReviewCallable(reviewData);
    return result.data;
  } catch (error: unknown) {
    console.error("Error submitting review:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to submit review: ${errorMessage}`);
  }
}

export async function getReviewsByReviewer(reviewerId: string): Promise<Review[]> {
  console.log(`Fetching reviews for reviewer ${reviewerId} from Firestore...`);
  const reviewsCol = collection(db, "reviews");
  const q = query(reviewsCol, where("reviewerId", "==", reviewerId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const reviews = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Review));
  return reviews;
}

export async function getAllReviews(limit: number = 50, offset: number = 0): Promise<{ reviews: Review[], pagination: any }> {
  console.log("Fetching all reviews via cloud function...");
  const functions = getFirebaseFunctions();
  const getAllReviewsCallable = httpsCallable(functions, 'getAllReviews');
  
  try {
    const result = await getAllReviewsCallable({ limit, offset });
    return result.data;
  } catch (error: unknown) {
    console.error("Error fetching all reviews:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to fetch all reviews: ${errorMessage}`);
  }
}

// New cloud function for getting review by token
export async function getReviewByToken(reviewId: string, token: string): Promise<Review> {
  console.log("Fetching review by token via cloud function...");
  const functions = getFirebaseFunctions();
  const getReviewByTokenCallable = httpsCallable(functions, 'getReviewByToken');
  
  try {
    const result = await getReviewByTokenCallable({ reviewId, token });
    return result.data.review;
  } catch (error: unknown) {
    console.error("Error fetching review by token:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to fetch review by token: ${errorMessage}`);
  }
}

export async function getReviewById(id: string): Promise<Review | null> {
  console.log(`Fetching review ${id} from Firestore...`);
  const docRef = doc(db, "reviews", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Review;
  } else {
    console.log("No such document!");
    return null;
  }
}

export async function hasReviewerSubmittedReview(submissionId: string, reviewerId: string): Promise<boolean> {
  console.log(`Checking if reviewer ${reviewerId} has submitted review for submission ${submissionId}...`);
  const reviewsCol = collection(db, "reviews");
  const q = query(reviewsCol, where("submissionId", "==", submissionId), where("reviewerId", "==", reviewerId), limit(1));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

export async function submitReviewAsAdmin(reviewData: ReviewFormValues & { submissionId: string; reviewerId: string; createdAt: string; submissionDetails: { artistName: string; songTitle: string } }, reviewerId: string): Promise<void> {
  console.log("Submitting review as admin via cloud function...");
  const functions = getFirebaseFunctions();
  const submitReviewCallable = httpsCallable(functions, 'submitReview');

  try {
    await submitReviewCallable({
      ...reviewData,
      reviewerId
    });
    console.log("Review submitted successfully as admin");
  } catch (error: unknown) {
    console.error("Error submitting review as admin:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to submit review: ${errorMessage}`);
  }
}
