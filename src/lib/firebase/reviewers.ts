
// This file contains all client-side functions for interacting with Reviewer data.
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./client";
import { Reviewer } from "../types";

export async function getReviewers(): Promise<Reviewer[]> {
  console.log("Fetching reviewers from Firestore...");
  try {
    const querySnapshot = await getDocs(query(collection(db, "reviewers"), orderBy("name")));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reviewer));
  } catch (error) {
    console.log("Failed to fetch reviewers, returning empty array:", error);
    // Return demo data for emulator mode
    const isEmulatorMode = process.env.NODE_ENV === 'development' && 
                          process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
    
    if (isEmulatorMode) {
      return [
        { 
          id: 'demo-reviewer-1', 
          name: 'Demo Reviewer 1', 
          email: 'reviewer1@test.com', 
          bio: 'Demo reviewer bio',
          genres: ['Pop', 'Rock/Indie'],
          rating: 4.5,
          totalReviews: 10,
          avatarUrl: '/USETHIS.png'
        },
        { 
          id: 'demo-reviewer-2', 
          name: 'Demo Reviewer 2', 
          email: 'reviewer2@test.com', 
          bio: 'Another demo reviewer bio',
          genres: ['Hip-Hop/R&B', 'Electronic'],
          rating: 4.8,
          totalReviews: 15,
          avatarUrl: '/USETHIS.png'
        }
      ] as Reviewer[];
    }
    return [];
  }
}
