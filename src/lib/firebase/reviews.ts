
// This file contains client-side functions for interacting with Review data.
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, orderBy, where, writeBatch, limit } from "firebase/firestore";
import { db } from "./client";
import { SUBMISSION_STATUS } from '../constants';
import type { Review, Submission } from '../types';
import { getSubmissionById } from './submissions';

export async function submitReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'submissionDetails'>): Promise<Review> {
  console.log("Submitting review to Firestore...");
  try {
    const submission = await getSubmissionById(reviewData.submissionId);
    if (!submission) {
      throw new Error(`Submission with ID ${reviewData.submissionId} not found.`);
    }

    const batch = writeBatch(db);

    const reviewRef = doc(collection(db, "reviews"));
    const newReview: Omit<Review, 'id'> = {
      ...reviewData,
      createdAt: new Date().toISOString(),
      submissionDetails: { artistName: submission.artistName, songTitle: submission.songTitle },
    };
    batch.set(reviewRef, newReview);

    const submissionRef = doc(db, "submissions", reviewData.submissionId);
    batch.update(submissionRef, { status: SUBMISSION_STATUS.REVIEWED, reviewedAt: new Date().toISOString() });

    await batch.commit();

    return { ...newReview, id: reviewRef.id };
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

export async function getAllReviews(): Promise<Review[]> {
  console.log("Fetching all reviews from Firestore...");
  const reviewsCol = collection(db, "reviews");
  const q = query(reviewsCol, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const reviews = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Review));
  return reviews;
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

export async function submitReviewAsAdmin(reviewData: Omit<Review, 'id' | 'createdAt' | 'submissionDetails'>, submissionId: string): Promise<Review> {
  console.log("Submitting review as admin to Firestore...");
  try {
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      throw new Error(`Submission with ID ${submissionId} not found.`);
    }

    const batch = writeBatch(db);

    const reviewRef = doc(collection(db, "reviews"));
    const newReview: Omit<Review, 'id'> = {
      ...reviewData,
      createdAt: new Date().toISOString(),
      submissionDetails: { artistName: submission.artistName, songTitle: submission.songTitle },
    };
    batch.set(reviewRef, newReview);

    const submissionRef = doc(db, "submissions", submissionId);
    batch.update(submissionRef, { status: SUBMISSION_STATUS.REVIEWED, reviewedAt: new Date().toISOString() });

    await batch.commit();

    return { ...newReview, id: reviewRef.id };
  } catch (error: unknown) {
    console.error("Error submitting review as admin:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to submit review as admin: ${errorMessage}`);
  }
}
