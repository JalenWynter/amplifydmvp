// This file contains all client-side functions for interacting with Submission data.
import { getFunctions, httpsCallable } from "firebase/functions";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { storage, getFirebaseFunctions } from "./client";
import { collection, getDocs, doc, getDoc, query, orderBy, where, updateDoc } from "firebase/firestore";
import { db } from "./client";
import type { Submission, Review } from '../types';

/**
 * Uploads a music file to Firebase Storage directly (simplified for emulator testing).
 * @param file The File object to upload.
 * @returns The full URL of the uploaded file in Firebase Storage.
 */
export async function uploadMusicFile(file: File): Promise<string> {
    console.log("Uploading file to Firebase Storage...");
    try {
        // Generate a unique file path for anonymous uploads
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const filePath = `music-uploads/temp/${timestamp}-${randomId}-${file.name}`;
        
        // Create a reference to the file location
        const fileRef = ref(storage, filePath);
        
        // Upload the file with metadata
        const metadata = {
            contentType: file.type,
            customMetadata: {
                'signedUrl': 'true',
                'uploadedBy': 'anonymous'
            }
        };
        
        const snapshot = await uploadBytes(fileRef, file, metadata);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        console.log("File uploaded successfully. Download URL:", downloadUrl);
        return downloadUrl;
    } catch (error: unknown) {
        console.error("Error in uploadMusicFile:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to upload music file: ${errorMessage}`);
    }
}

export async function getSubmissions(options: { all?: boolean; reviewerId?: string; artistId?: string } = {}): Promise<Submission[]> {
  console.log(`Fetching submissions from Firestore (all: ${!!options.all}, reviewerId: ${options.reviewerId || 'none'}, artistId: ${options.artistId || 'none'})...`);
  try {
    const submissionsCol = collection(db, "submissions");
    
    let q = query(submissionsCol, orderBy("submittedAt", "desc"));

    if (options.reviewerId) {
        q = query(q, where("reviewerId", "==", options.reviewerId));
    } else if (options.artistId) {
        q = query(q, where("artistId", "==", options.artistId));
    } else if (!options.all) {
        q = query(q, where("status", "==", "Pending Review"));
    }
    const querySnapshot = await getDocs(q);
    
    const submissions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Submission));
    
    return submissions;
  } catch (error) {
    console.log("Failed to fetch submissions, returning empty array:", error);
    // Return demo data for emulator mode
    const isEmulatorMode = process.env.NODE_ENV === 'development' && 
                          process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
    
    if (isEmulatorMode) {
      return [
        { 
          id: 'demo1', 
          artistName: 'Demo Artist', 
          songTitle: 'Demo Song', 
          genre: 'Pop',
          status: 'pending',
          submittedAt: new Date().toISOString(),
          uploaderEmail: 'demo@test.com',
          reviewerId: 'demo-reviewer',
          packageId: 'demo-package',
          paymentIntentId: 'demo-payment',
          trackingToken: 'demo-token',
          contactEmail: 'demo@test.com',
          audioUrl: 'demo-url',
          songUrl: 'demo-url'
        }
      ] as Submission[];
    }
    return [];
  }
}

// New cloud function for reviewers to get their pending submissions
export async function getSubmissionsForReviewer(): Promise<Submission[]> {
  console.log("Fetching submissions for reviewer via cloud function...");
  const functions = getFirebaseFunctions();
  const getSubmissionsCallable = httpsCallable(functions, 'getSubmissionsForReviewer');
  
  try {
    const result = await getSubmissionsCallable();
    return result.data.submissions;
  } catch (error: unknown) {
    console.error("Error fetching submissions for reviewer:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to fetch submissions for reviewer: ${errorMessage}`);
  }
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
  console.log(`Fetching submission ${id} from Firestore...`);
  const docRef = doc(db, "submissions", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Submission;
  } else {
    console.log("No such document!");
    return null;
  }
}

export async function getSubmissionStatusByToken(data: { trackingToken?: string, uploaderEmail?: string }): Promise<{ success: boolean, submission?: Partial<Submission>, review?: Partial<Review>, submissions?: Partial<Submission>[], error?: string }> {
    const functions = getFirebaseFunctions();
    const getStatusCallable = httpsCallable(functions, 'getSubmissionStatusByToken');
    try {
        const result = await getStatusCallable(data);
        return result.data as { success: boolean, submission?: Partial<Submission>, review?: Partial<Review>, submissions?: Partial<Submission>[], error?: string };
    } catch (error: unknown) {
        console.error("Error calling getSubmissionStatusByToken Cloud Function:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to get submission status: ${errorMessage}`);
    }
}

export async function getSubmissionsForAdmin(): Promise<Submission[]> {
  console.log("Fetching all submissions for admin from Firestore...");
  const submissionsCol = collection(db, "submissions");
  const q = query(submissionsCol, orderBy("submittedAt", "desc"));
  const querySnapshot = await getDocs(q);
  const submissions = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Submission));
  return submissions;
}

export async function updateSubmissionStatus(submissionId: string, status: Submission['status']): Promise<void> {
  console.log(`Updating submission ${submissionId} status to ${status}`);
  const submissionRef = doc(db, "submissions", submissionId);
  try {
    await updateDoc(submissionRef, { status });
  } catch (error: unknown) {
    console.error("Error updating submission status:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to update submission status: ${errorMessage}`);
  }
}

export async function assignReviewerToSubmission(submissionId: string, reviewerId: string): Promise<void> {
  console.log(`Assigning reviewer ${reviewerId} to submission ${submissionId}`);
  const submissionRef = doc(db, "submissions", submissionId);
  try {
    await updateDoc(submissionRef, { reviewerId });
  } catch (error: unknown) {
    console.error("Error assigning reviewer to submission:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to assign reviewer to submission: ${errorMessage}`);
  }
}

export async function createSubmissionViaFunction(submissionData: {
    artistName: string;
    songTitle: string;
    contactEmail: string;
    audioUrl: string;
    genre: string;
    reviewerId: string;
    packageId: string;
    paymentIntentId?: string;
    amount?: number;
    currency?: string;
    stripeSessionId?: string;
    packageName?: string;
    packageDescription?: string;
}): Promise<{ success: boolean; submissionId: string; trackingToken: string; message: string }> {
    console.log("Creating submission via cloud function...");
    const functions = getFirebaseFunctions();
    const createSubmissionCallable = httpsCallable(functions, 'createSubmission');

    try {
        const result = await createSubmissionCallable(submissionData);
        return result.data as { success: boolean; submissionId: string; trackingToken: string; message: string };
    } catch (error: unknown) {
        console.error("Error creating submission:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to create submission: ${errorMessage}`);
    }
}