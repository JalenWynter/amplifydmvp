
// This file will contain all the functions to interact with Firebase services (Firestore, Storage, etc.)
import { collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, query, orderBy, where, arrayUnion, arrayRemove, writeBatch, limit, deleteDoc, getCountFromServer } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "./client";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ReviewFormValues } from "@/components/review/scoring-chart";
import { 
  USER_ROLE, 
  USER_STATUS, 
  APPLICATION_STATUS, 
  SUBMISSION_STATUS, 
  REFERRAL_CODE_STATUS, 
  PAYOUT_STATUS, 
  TRANSACTION_STATUS,
  REFERRAL_EARNING_STATUS,
  APPLICATION_MODE,
  DEFAULTS
} from '../constants';
import type {
  AppSettings,
  ReviewPackage,
  Reviewer,
  User,
  Transaction,
  Application,
  PayoutReview,
  Payout,
  Submission,
  Review,
  ReferralCode,
  ReferralEarning,
  ReferralStats,
  DashboardStats,
  FinancialStats,
  ReviewerEarnings
} from '../types';

// Export types for backward compatibility
export type {
  AppSettings,
  ReviewPackage,
  Reviewer,
  User,
  Transaction,
  Application,
  PayoutReview,
  Payout,
  Submission,
  Review,
  ReferralCode,
  ReferralEarning,
  ReferralStats,
  DashboardStats,
  FinancialStats
};

/**
 * API CALLS
 * These functions use the Firebase SDK to interact with Firestore.
 */

// In a real app, this would be memoized or fetched less frequently.
let cachedReviewers: Reviewer[] | null = null;
let cachedSettings: AppSettings | null = null;


// Invalidate cache when reviewer data changes
function invalidateReviewerCache() {
    console.log("Reviewer cache invalidated.");
    cachedReviewers = null;
}


// CLIENT-SIDE: For use in Client Components
export async function getAppSettings(): Promise<AppSettings> {
    if (cachedSettings) {
        return cachedSettings;
    }
    const settingsRef = doc(db, "settings", "app-config");
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
        cachedSettings = docSnap.data() as AppSettings;
        return cachedSettings;
    } else {
        // Default settings if none exist
        const defaultSettings: AppSettings = { applicationMode: APPLICATION_MODE.INVITE_ONLY };
        await setDoc(settingsRef, defaultSettings);
        cachedSettings = defaultSettings;
        return defaultSettings;
    }
}

export async function updateAppSettings(newSettings: Partial<AppSettings>): Promise<void> {
    const settingsRef = doc(db, "settings", "app-config");
    await updateDoc(settingsRef, newSettings);
    cachedSettings = null; // Invalidate cache
}


export async function getReviewers(): Promise<Reviewer[]> {
    if (cachedReviewers) {
        console.log("Returning cached reviewers...");
        return cachedReviewers;
    }
    console.log("Fetching reviewers from Firestore...");
    const querySnapshot = await getDocs(query(collection(db, "reviewers"), orderBy("name")));
    const reviewers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reviewer));
    cachedReviewers = reviewers;
    return reviewers;
}


export async function getReviewerById(id: string): Promise<Reviewer | null> {
    console.log(`Fetching reviewer ${id} from Firestore...`);
    const docRef = doc(db, "reviewers", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Reviewer;
    } else {
        console.log("No such document!");
        return null;
    }
}

export async function updateReviewerProfile(reviewerId: string, data: Partial<Pick<Reviewer, 'name' | 'turnaround' | 'experience' | 'genres'>>): Promise<void> {
    const reviewerRef = doc(db, "reviewers", reviewerId);
    await updateDoc(reviewerRef, data);
    invalidateReviewerCache();
    console.log(`Profile updated for reviewer ${reviewerId}`);
}


export async function addPackage(reviewerId: string, packageData: Omit<ReviewPackage, 'id'>): Promise<ReviewPackage> {
    const newPackage: ReviewPackage = {
        ...packageData,
        id: `pkg_${new Date().getTime()}` // Simple unique ID
    };
    const reviewerRef = doc(db, "reviewers", reviewerId);
    await updateDoc(reviewerRef, {
        packages: arrayUnion(newPackage)
    });
    invalidateReviewerCache();
    console.log(`Package added for reviewer ${reviewerId}`);
    return newPackage;
}

export async function updatePackage(reviewerId: string, updatedPackage: ReviewPackage): Promise<void> {
    const reviewerRef = doc(db, "reviewers", reviewerId);
    const reviewerSnap = await getDoc(reviewerRef);

    if (!reviewerSnap.exists()) {
        throw new Error("Reviewer not found");
    }

    const reviewerData = reviewerSnap.data() as Reviewer;
    const updatedPackages = reviewerData.packages.map(pkg => 
        pkg.id === updatedPackage.id ? updatedPackage : pkg
    );
    
    await updateDoc(reviewerRef, { packages: updatedPackages });
    invalidateReviewerCache();
    console.log(`Package ${updatedPackage.id} updated for reviewer ${reviewerId}`);
}

export async function deletePackage(reviewerId: string, packageId: string): Promise<void> {
     const reviewerRef = doc(db, "reviewers", reviewerId);
    const reviewerSnap = await getDoc(reviewerRef);

    if (!reviewerSnap.exists()) {
        throw new Error("Reviewer not found");
    }

    const reviewerData = reviewerSnap.data() as Reviewer;
    const packageToDelete = reviewerData.packages.find(pkg => pkg.id === packageId);

    if (!packageToDelete) {
        console.warn(`Package ${packageId} not found for deletion.`);
        return;
    }

    await updateDoc(reviewerRef, {
        packages: arrayRemove(packageToDelete)
    });
    invalidateReviewerCache();
    console.log(`Package ${packageId} deleted for reviewer ${reviewerId}`);
}



export async function getUsers(): Promise<User[]> {
  console.log("Fetching users from Firestore...");
  const querySnapshot = await getDocs(query(collection(db, "users"), orderBy("joinedAt", "desc")));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

export async function getApplications(): Promise<Application[]> {
  console.log("Fetching applications from Firestore...");
  const applicationsCol = collection(db, "applications");
  const q = query(applicationsCol, orderBy("submittedAt", "desc"));
  const querySnapshot = await getDocs(q);
  const applications = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Application));
  return applications;
}

export async function getApplicationById(id: string): Promise<Application | null> {
  console.log(`Fetching application ${id} from Firestore...`);
  const docRef = doc(db, "applications", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Application;
  } else {
    console.log("No such document!");
    return null;
  }
}

export async function updateApplicationStatus(id: string, status: typeof APPLICATION_STATUS.APPROVED | typeof APPLICATION_STATUS.REJECTED): Promise<void> {
    console.log(`Updating application ${id} status to ${status}`);
    const appRef = doc(db, "applications", id);
    const appSnap = await getDoc(appRef);
    if (!appSnap.exists()) {
        throw new Error("Application not found.");
    }
    const appData = appSnap.data() as Application;

    const batch = writeBatch(db);
    batch.update(appRef, { status: status });

    if (status === APPLICATION_STATUS.APPROVED) {
        const reviewerRef = doc(db, "reviewers", appData.userId);
        const reviewerSnap = await getDoc(reviewerRef);
        
        // Only create reviewer profile if it doesn't already exist
        if (!reviewerSnap.exists()) {
            const reviewerDoc: Omit<Reviewer, 'id'> = {
                name: appData.name,
                genres: [], // Default value, can be edited in profile
                turnaround: '5 days', // Default value
                experience: appData.musicBackground,
                avatarUrl: '', // Default value, can be edited in profile
                packages: []
            };
            batch.set(reviewerRef, reviewerDoc);
            invalidateReviewerCache();
        }
    }
    await batch.commit();
}

// Production-ready application approval with automatic user creation
export async function approveApplicationWithUserCreation(
  applicationId: string, 
  temporaryPassword?: string
): Promise<void> {
  console.log(`Approving application ${applicationId} with user creation...`);
  
  const appRef = doc(db, "applications", applicationId);
  const appSnap = await getDoc(appRef);
  
  if (!appSnap.exists()) {
    throw new Error("Application not found.");
  }
  
  const appData = appSnap.data() as Application;
  
  // Generate a secure random password if none provided
  const password = temporaryPassword || generateSecurePassword();
  
  const batch = writeBatch(db);
  
  try {
    // 1. Create Firebase Auth user (if not exists)
    let firebaseUID: string;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, appData.email, password);
      firebaseUID = userCredential.user.uid;
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        // Get existing user's UID - would need server-side admin SDK for this
        console.log("User already exists in Firebase Auth");
        throw new Error("User already exists. Please use existing authentication.");
      }
      throw error;
    }
    
    // 2. Update application status
    batch.update(appRef, { 
      status: APPLICATION_STATUS.APPROVED,
      userId: firebaseUID // Update with real Firebase UID
    });
    
    // 3. Create user document with real UID
    const userDoc: Omit<User, 'id'> = {
      name: appData.name,
      email: appData.email,
      role: USER_ROLE.REVIEWER,
      status: USER_STATUS.ACTIVE,
      joinedAt: new Date().toISOString(),
      avatarUrl: ''
    };
    
    batch.set(doc(db, "users", firebaseUID), userDoc);
    
    // 4. Create reviewer document with real UID
    const reviewerDoc: Reviewer = {
      id: firebaseUID,
      name: appData.name,
      avatarUrl: '',
      dataAiHint: '',
      turnaround: '3-5 days',
      genres: [],
      experience: appData.musicBackground,
      packages: []
    };
    
    batch.set(doc(db, "reviewers", firebaseUID), reviewerDoc);
    
    await batch.commit();
    
    console.log(`✅ Application approved and user created with UID: ${firebaseUID}`);
    
    // Clear cache
    invalidateReviewerCache();
    
    // TODO: Send email with temporary password
    console.log(`📧 TODO: Send email to ${appData.email} with temporary password: ${password}`);
    
  } catch (error) {
    console.error("Error approving application:", error);
    throw error;
  }
}

// Helper function to generate secure random password
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 26)); // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26)); // Lowercase  
  password += '0123456789'.charAt(Math.floor(Math.random() * 10)); // Number
  password += '!@#$%^&*'.charAt(Math.floor(Math.random() * 8)); // Special char
  
  // Fill remaining length with random chars
  for (let i = 4; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}


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

export async function createPayout(payoutData: Omit<Payout, 'id' | 'date' | 'status'>): Promise<Payout> {
    console.log("Creating new manual payout...");
    const newPayout: Omit<Payout, 'id'> = {
        ...payoutData,
        date: new Date().toISOString(),
        status: 'Pending'
    };

    const docRef = await addDoc(collection(db, "payouts"), newPayout);
    
    return { ...newPayout, id: docRef.id };
}

export async function updatePayoutStatus(payoutId: string, status: Payout['status']): Promise<void> {
    console.log(`Updating payout ${payoutId} status to ${status}`);
    const payoutRef = doc(db, "payouts", payoutId);
    const dataToUpdate: { status: Payout['status'], paidDate?: string } = { status };
    if (status === 'Paid') {
        dataToUpdate.paidDate = new Date().toISOString();
    }
    await updateDoc(payoutRef, dataToUpdate);
}


// Write operations
export async function addApplication(
    applicationData: Omit<Application, 'id' | 'status' | 'submittedAt' | 'userId'>,
    password: string
): Promise<Application> {
    console.log("Creating user and adding new application to Firestore...");

    // Check application mode
    const settings = await getAppSettings();
    if (settings.applicationMode === APPLICATION_MODE.INVITE_ONLY) {
        if (!applicationData.referral) {
            throw new Error("An invite code is required to apply. Please provide one.");
        }
        
        console.log(`Validating referral code: ${applicationData.referral}`);
        const codesRef = collection(db, "referralCodes");
        const q = query(codesRef, where("code", "==", applicationData.referral), limit(1));
        const codeSnapshot = await getDocs(q);

        if (codeSnapshot.empty) {
            throw new Error("The provided invite code is invalid.");
        }
        
        const codeDoc = codeSnapshot.docs[0];
        const codeData = codeDoc.data() as ReferralCode;

        if (codeData.status !== REFERRAL_CODE_STATUS.ACTIVE) {
            throw new Error("This invite code is no longer active.");
        }

        const expiryDate = new Date(new Date(codeData.createdAt).getTime() + 24 * 60 * 60 * 1000);
        if (new Date() > expiryDate) {
            await updateDoc(doc(db, "referralCodes", codeDoc.id), { status: REFERRAL_CODE_STATUS.EXPIRED });
            throw new Error("This invite code has expired.");
        }
    }


    // 1. Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, applicationData.email, password);
    const user = userCredential.user;

    const batch = writeBatch(db);

    // 2. Create the application document in Firestore
    const appWithDetails = {
        ...applicationData,
        userId: user.uid, // Link application to the created user
        status: APPLICATION_STATUS.PENDING_REVIEW,
        submittedAt: new Date().toISOString(),
    };

    const appDocRef = doc(collection(db, "applications"));
    batch.set(appDocRef, appWithDetails);
    
    // 3. Create a corresponding user document in the 'users' collection
    const userDoc: Omit<User, 'id'> = {
        name: applicationData.name,
        email: applicationData.email,
        role: USER_ROLE.REVIEWER, // Default role upon application
        status: USER_STATUS.ACTIVE, // User is active, but application is pending
        joinedAt: new Date().toISOString(),
        avatarUrl: '' // Can be set later
    }
    const userDocRef = doc(db, "users", user.uid);
    batch.set(userDocRef, userDoc);

    // 4. If an invite code was used and valid, mark it as 'Used'
    if (settings.applicationMode === APPLICATION_MODE.INVITE_ONLY && applicationData.referral) {
        const codesRef = collection(db, "referralCodes");
        const q = query(codesRef, where("code", "==", applicationData.referral), limit(1));
        const codeSnapshot = await getDocs(q);
        if (!codeSnapshot.empty) {
            const codeRef = codeSnapshot.docs[0].ref;
            batch.update(codeRef, { status: REFERRAL_CODE_STATUS.USED });
            console.log(`Referral code ${applicationData.referral} marked as used.`);
        }
    }

    await batch.commit();

    return { ...appWithDetails, id: appDocRef.id };
}


export async function uploadFile(file: File): Promise<string> {
  console.log("Uploading file to Firebase Storage...");
  const storageRef = ref(storage, `submissions/${new Date().getTime()}-${file.name}`);
  const uploadResult = await uploadBytes(storageRef, file);
  const audioUrl = await getDownloadURL(uploadResult.ref);
  console.log("File uploaded successfully. URL:", audioUrl);
  return audioUrl;
}

export async function createSubmissionFromWebhook(
  submissionData: Omit<Submission, 'id' | 'status' | 'submittedAt'>
): Promise<Submission> {
  console.log("Creating submission record from webhook...");

  const submissionWithDetails = {
    ...submissionData,
    status: SUBMISSION_STATUS.PENDING_REVIEW,
    submittedAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, "submissions"), submissionWithDetails);

  return { ...submissionWithDetails, id: docRef.id };
}

export async function getSubmissions(options: { all?: boolean; reviewerId?: string } = {}): Promise<Submission[]> {
  console.log(`Fetching submissions from Firestore (all: ${!!options.all}, reviewerId: ${options.reviewerId || 'none'})...`);
  const submissionsCol = collection(db, "submissions");
  
  let q;
  if (options.reviewerId) {
      // Get submissions for specific reviewer
      q = query(submissionsCol, where("reviewerId", "==", options.reviewerId), orderBy("submittedAt", "desc"));
  } else if (options.all) {
      q = query(submissionsCol, orderBy("submittedAt", "desc"));
  } else {
      q = query(submissionsCol, where("status", "==", "Pending Review"), orderBy("submittedAt", "desc"));
  }
  const querySnapshot = await getDocs(q);
  
  const submissions = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Submission));
  
  return submissions;
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

export async function submitReview(
    submission: Submission, 
    reviewData: ReviewFormValues,
    overallScore: number
): Promise<{ reviewId: string; reviewUrl: string }> {
    if (!auth.currentUser) throw new Error("Authentication is required to submit a review.");

    const { strengths, improvements, summary, ...scores } = reviewData;

    const review: Omit<Review, 'id'> = {
        submissionId: submission.id,
        reviewerId: auth.currentUser.uid,
        scores,
        overallScore,
        strengths,
        improvements,
        summary,
        createdAt: new Date().toISOString(),
        submissionDetails: {
            artistName: submission.artistName,
            songTitle: submission.songTitle
        }
    };
    
    const batch = writeBatch(db);

    // Save the new review
    const reviewRef = doc(collection(db, "reviews"));
    batch.set(reviewRef, review);

    // Update the original submission's status
    const submissionRef = doc(db, "submissions", submission.id);
    batch.update(submissionRef, { status: SUBMISSION_STATUS.REVIEWED });
    
    await batch.commit();

    console.log(`Review submitted for submission ${submission.id}`);
    
    return {
        reviewId: reviewRef.id,
        reviewUrl: `/review/${reviewRef.id}`
    };
}


export async function getReviewsByReviewer(reviewerId: string): Promise<Review[]> {
    console.log(`Fetching reviews for reviewer ${reviewerId}...`);
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
    
    const reviews = await Promise.all(
        querySnapshot.docs.map(async (reviewDoc) => {
            const reviewData = { id: reviewDoc.id, ...reviewDoc.data() } as Review;
            
            // Fetch submission details to get artist name and song title
            try {
                const submissionRef = doc(db, "submissions", reviewData.submissionId);
                const submissionDoc = await getDoc(submissionRef);
                if (submissionDoc.exists()) {
                    const submissionData = submissionDoc.data() as Submission;
                    reviewData.submissionDetails = {
                        artistName: submissionData.artistName,
                        songTitle: submissionData.songTitle
                    };
                } else {
                    // Fallback if submission not found
                    reviewData.submissionDetails = {
                        artistName: "Unknown Artist",
                        songTitle: "Unknown Song"
                    };
                }
            } catch (error) {
                console.error(`Error fetching submission details for review ${reviewData.id}:`, error);
                reviewData.submissionDetails = {
                    artistName: "Unknown Artist",
                    songTitle: "Unknown Song"
                };
            }
            
            return reviewData;
        })
    );
    
    return reviews;
}

export async function getReferralCodes(): Promise<ReferralCode[]> {
    console.log("Fetching referral codes from Firestore...");
    const codesCol = collection(db, "referralCodes");
    const q = query(codesCol, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const codes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as ReferralCode));
    return codes;
}

export async function createReferralCode(associatedUser: string): Promise<ReferralCode> {
    console.log(`Creating referral code for ${associatedUser}...`);
    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newCode = `INVITE-${randomSuffix}`;

    const referralCode: Omit<ReferralCode, 'id'> = {
        code: newCode,
        associatedUser,
        status: REFERRAL_CODE_STATUS.ACTIVE,
        createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "referralCodes"), referralCode);

    return { ...referralCode, id: docRef.id };
}


// ==================
// AGGREGATION & STATS
// ==================

async function getCollectionCount(collectionName: string): Promise<number> {
    try {
        const snapshot = await getCountFromServer(collection(db, collectionName));
        return snapshot.data().count;
    } catch (error) {
        console.error(`Error getting count for ${collectionName}:`, error);
        return 0;
    }
}

export async function getDashboardStats(): Promise<DashboardStats> {
    console.log("Fetching dashboard stats...");
    const [totalUsers, totalReviewers, totalSubmissions, completedReviews] = await Promise.all([
        getCollectionCount("users"),
        getCollectionCount("reviewers"),
        getCollectionCount("submissions"),
        getCountFromServer(query(collection(db, "reviews")))
            .then(s => s.data().count)
            .catch(() => 0),
    ]);
    return { totalUsers, totalReviewers, totalSubmissions, completedReviews };
}

export async function getFinancialStats(): Promise<FinancialStats> {
    console.log("Fetching financial stats...");

    // 1. Get all submissions to calculate total revenue
    const submissionsSnapshot = await getDocs(collection(db, "submissions"));
    const reviewers = await getReviewers(); // Use cached or fetched reviewers
    
    let totalRevenue = 0;
    submissionsSnapshot.forEach(subDoc => {
        const submission = subDoc.data() as Submission;
        const reviewer = reviewers.find(r => r.id === submission.reviewerId);
        const pkg = reviewer?.packages.find(p => p.id === submission.packageId);
        if (pkg) {
            totalRevenue += pkg.priceInCents / 100;
        }
    });

    // 2. Get all payouts to calculate pending total
    const payoutsSnapshot = await getDocs(query(collection(db, "payouts"), where("status", "==", "Pending")));
    let pendingPayouts = 0;
    payoutsSnapshot.forEach(payoutDoc => {
        const amountString = (payoutDoc.data() as Payout).amount.replace('$', '');
        pendingPayouts += parseFloat(amountString);
    });

    // 3. Get total users for average calculation
    const totalUsers = await getCollectionCount("users");

    return {
        totalRevenue,
        avgRevenuePerUser: totalUsers > 0 ? totalRevenue / totalUsers : 0,
        pendingPayouts,
        pendingPayoutsCount: payoutsSnapshot.size,
        totalUsers
    };
}


// ==================
// DATABASE SEEDING
// ==================
export async function seedDatabase() {
  console.log("Starting database seed...");
  const batch = writeBatch(db);

  // Clear existing data
  console.log("Clearing existing data from seedable collections...");
  const collectionsToClear = ["users", "reviewers", "applications", "payouts", "submissions", "reviews", "referralCodes", "settings"];
  for (const collectionName of collectionsToClear) {
    try {
        const snapshot = await getDocs(collection(db, collectionName));
        if (snapshot.docs.length > 0) {
            console.log(`Deleting ${snapshot.docs.length} documents from ${collectionName}...`);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
        }
    } catch (e) {
        console.warn(`Could not query collection ${collectionName} for deletion. It might not exist yet.`, e);
    }
  }
  await batch.commit(); // Commit deletions first
  
  const seedBatch = writeBatch(db);
  console.log("Seeding new data...");

  // Seed App Settings
  seedBatch.set(doc(db, "settings", "app-config"), { applicationMode: APPLICATION_MODE.INVITE_ONLY });

  // Seed Users
  const usersToSeed: Omit<User, 'id'>[] = [
    { name: 'Admin User', email: 'jwynterthomas@gmail.com', role: USER_ROLE.ADMIN, status: USER_STATUS.ACTIVE, joinedAt: new Date('2024-05-01').toISOString(), avatarUrl: 'https://placehold.co/40x40.png' },
    { name: 'Brenda "Vocals" Lee', email: 'brenda.lee@amplifyd.com', role: USER_ROLE.REVIEWER, status: USER_STATUS.ACTIVE, joinedAt: new Date('2024-06-15').toISOString(), avatarUrl: 'https://placehold.co/40x40.png' },
    { name: 'Alex "Synth" Chen', email: 'alex.chen@amplifyd.com', role: USER_ROLE.REVIEWER, status: USER_STATUS.ACTIVE, joinedAt: new Date('2024-06-20').toISOString(), avatarUrl: 'https://placehold.co/40x40.png' },
    { name: 'Cosmic Dreamer', email: 'cosmic@dreamer.com', role: USER_ROLE.ARTIST, status: USER_STATUS.ACTIVE, joinedAt: new Date('2024-07-28').toISOString(), avatarUrl: 'https://placehold.co/40x40.png' }
  ];
  const userIds = ['admin_user_01', 'reviewer_user_01', 'reviewer_user_02', 'artist_user_01'];
  usersToSeed.forEach((user, index) => {
    seedBatch.set(doc(db, "users", userIds[index]), user);
  });

  // Seed Reviewers
  const reviewersToSeed: Reviewer[] = [
    {
      id: "reviewer_user_01",
      name: 'Brenda "Vocals" Lee',
      avatarUrl: "https://placehold.co/150x150.png",
      dataAiHint: "woman portrait",
      turnaround: "3-5 days",
      genres: ["Pop", "R&B", "Vocal Performance"],
      experience: "With over 15 years in the industry, I've had the privilege of working on multiple gold-certified records. My expertise lies in indie pop and synthwave, and I specialize in mixing and mastering.",
      packages: [
        { id: "pkg_01_01", name: "Standard Written Review", priceInCents: 2500, description: "Detailed written feedback on your track.", trackCount: 1, formats: ["written", "chart"] },
        { id: "pkg_01_02", name: "Audio Commentary", priceInCents: 4000, description: "A full audio breakdown of your song.", trackCount: 1, formats: ["audio", "chart"] }
      ]
    },
     {
      id: "reviewer_user_02",
      name: 'Alex "Synth" Chen',
      avatarUrl: "https://placehold.co/150x150.png",
      dataAiHint: "man portrait",
      turnaround: "2-4 days",
      genres: ["Electronic", "Synthwave", "Sound Design"],
      experience: "As an electronic music producer, I live and breathe synths and sound design. I can help you craft unique sonic landscapes.",
      packages: [
        { id: "pkg_02_01", name: "Synth & Sound Design Checkup", priceInCents: 3000, description: "Deep dive into your sound design choices.", trackCount: 1, formats: ["written", "chart"] }
      ]
    }
  ];
  reviewersToSeed.forEach(reviewer => {
     seedBatch.set(doc(db, "reviewers", reviewer.id), reviewer);
  });
  
  invalidateReviewerCache(); // Ensure cache is cleared after seeding

  // Seed Applications
  const applicationsToSeed: Omit<Application, 'id'>[] = [
      { userId: 'new_user_id_1', name: 'John Doe', email: 'john.doe@example.com', status: APPLICATION_STATUS.PENDING_REVIEW, primaryRole: 'Producer / Engineer', portfolioLink: 'https://linkedin.com/in/johndoeproducer', musicBackground: "With over 15 years in the industry, I've worked on multiple gold-certified records.", joinReason: "I'm passionate about discovering new talent and helping artists refine their sound.", referral: "", submittedAt: new Date('2024-07-28').toISOString() },
      { userId: 'new_user_id_2', name: 'Jane Smith', email: 'jane.smith@music.com', status: APPLICATION_STATUS.PENDING_REVIEW, primaryRole: 'A&R', portfolioLink: 'https://janesmithmusic.com', musicBackground: "As an A&R for a prominent indie label, I've signed and developed several successful artists.", joinReason: "I'm looking to broaden my network and find raw talent outside of the usual channels.", referral: "", submittedAt: new Date('2024-07-27').toISOString() },
  ];
  applicationsToSeed.forEach(app => {
      seedBatch.set(doc(collection(db, "applications")), app);
  });

  // Seed Payouts
  const payoutsToSeed: Omit<Payout, 'id'>[] = [
    {
        reviewer: { id: 'reviewer_user_01', name: 'Brenda "Vocals" Lee', email: 'brenda.lee@amplifyd.com', avatarUrl: 'https://placehold.co/40x40.png' },
        amount: '$450.00', status: PAYOUT_STATUS.PAID, date: '2024-07-15T00:00:00.000Z', paidDate: '2024-07-18T00:00:00.000Z', paymentMethod: 'PayPal',
        reviews: [ { id: 'rev_01', artist: 'Cosmic Dreamer', song: 'Starlight Echoes', date: '2024-07-10T00:00:00.000Z', fee: 25.00 }]
    },
    {
        reviewer: { id: 'reviewer_user_02', name: 'Alex "Synth" Chen', email: 'alex.chen@amplifyd.com', avatarUrl: 'https://placehold.co/40x40.png' },
        amount: '$75.00', status: PAYOUT_STATUS.PENDING, date: '2024-08-01T00:00:00.000Z', paymentMethod: 'Stripe Connect',
        reviews: [ { id: 'rev_03', artist: 'Lofi Beats', song: 'Chill Waves', date: '2024-07-28T00:00:00.000Z', fee: 15.00 }]
    }
  ];
   payoutsToSeed.forEach(payout => {
      seedBatch.set(doc(collection(db, "payouts")), payout);
  });

  // Seed Referral Codes
  const referralCodesToSeed: Omit<ReferralCode, 'id'>[] = [
    { code: 'INVITE-USED123', associatedUser: 'brenda.lee@amplifyd.com', status: REFERRAL_CODE_STATUS.USED, createdAt: new Date('2024-07-20').toISOString() },
    { code: 'INVITE-ACTIVE456', associatedUser: 'alex.chen@amplifyd.com', status: REFERRAL_CODE_STATUS.ACTIVE, createdAt: new Date().toISOString() },
    { code: 'INVITE-EXPIRED789', associatedUser: 'admin.user@amplifyd.com', status: REFERRAL_CODE_STATUS.EXPIRED, createdAt: new Date('2024-07-01').toISOString() }
  ];
  referralCodesToSeed.forEach(code => {
    seedBatch.set(doc(collection(db, "referralCodes")), code);
  });

  await seedBatch.commit();
  console.log("Database seeding completed successfully.");
}

// Create transaction record
export async function createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const transaction: Omit<Transaction, 'id'> = {
    ...transactionData,
    createdAt: now,
    updatedAt: now,
  };
  
  const docRef = await addDoc(collection(db, 'transactions'), transaction);
  return docRef.id;
}

// Get all transactions for admin
export async function getTransactions(): Promise<Transaction[]> {
  console.log("Fetching all transactions from Firestore...");
  const transactionsCol = collection(db, "transactions");
  const q = query(transactionsCol, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  const transactions = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Transaction));
  
  return transactions;
}

// Get transaction statistics for admin dashboard
export async function getTransactionStats(): Promise<{
  successfulTransactions: number;
  totalTransactions: number;
  conversionRate: number;
  failedTransactions: number;
}> {
  console.log("Calculating transaction statistics...");
  const transactions = await getTransactions();
  
  const totalTransactions = transactions.length;
  const successfulTransactions = transactions.filter(t => t.status === TRANSACTION_STATUS.COMPLETED).length;
  const failedTransactions = transactions.filter(t => t.status === TRANSACTION_STATUS.FAILED).length;
  const conversionRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
  
  return {
    successfulTransactions,
    totalTransactions,
    conversionRate,
    failedTransactions
  };
}

// Get transaction by Stripe session ID
export async function getTransactionBySessionId(sessionId: string): Promise<Transaction | null> {
  console.log(`Fetching transaction with session ID: ${sessionId}`);
  const transactionsCol = collection(db, "transactions");
  const q = query(transactionsCol, where("stripeSessionId", "==", sessionId));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as Transaction;
}

// Update transaction status
export async function updateTransactionStatus(
  transactionId: string, 
  status: typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS],
  additionalData?: Partial<Transaction>
): Promise<void> {
  console.log(`Updating transaction ${transactionId} status to ${status}`);
  const transactionRef = doc(db, "transactions", transactionId);
  
  const updateData: any = {
    status,
    updatedAt: new Date().toISOString(),
    ...additionalData
  };
  
  await updateDoc(transactionRef, updateData);
}

// Get all referral codes for admin
export async function getAllReferralCodes(): Promise<ReferralCode[]> {
  console.log("Fetching all referral codes from Firestore...");
  const codesCol = collection(db, "referralCodes");
  const q = query(codesCol, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  const codes = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ReferralCode));
  
  return codes;
}

// Get referral earnings for admin or specific user
export async function getReferralEarnings(userId?: string): Promise<ReferralEarning[]> {
  console.log(`Fetching referral earnings${userId ? ` for user ${userId}` : ' for all users'}...`);
  const earningsCol = collection(db, "referralEarnings");
  
  let q;
  if (userId === 'all' || !userId) {
    q = query(earningsCol, orderBy("createdAt", "desc"));
  } else {
    q = query(earningsCol, where("referrerId", "==", userId), orderBy("createdAt", "desc"));
  }
  
  const querySnapshot = await getDocs(q);
  
  const earnings = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ReferralEarning));
  
  return earnings;
}

// Get referral statistics for a user
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  console.log(`Calculating referral stats for user ${userId}...`);
  
  const [referralCodes, referralEarnings] = await Promise.all([
    getReferralCodes(), // Get user's referral codes
    getReferralEarnings(userId) // Get user's referral earnings
  ]);
  
  const userCodes = referralCodes.filter(code => code.associatedUser === userId);
  const totalReferrals = userCodes.filter(code => code.status === REFERRAL_CODE_STATUS.USED).length;
  const activeReferrals = userCodes.filter(code => code.status === REFERRAL_CODE_STATUS.ACTIVE).length;
  
  const totalEarnings = referralEarnings.reduce((sum, earning) => sum + earning.commissionAmount, 0);
  const pendingEarnings = referralEarnings.filter(e => e.status === 'pending').reduce((sum, earning) => sum + earning.commissionAmount, 0);
  const paidEarnings = referralEarnings.filter(e => e.status === 'paid').reduce((sum, earning) => sum + earning.commissionAmount, 0);
  
  const conversionRate = userCodes.length > 0 ? (totalReferrals / userCodes.length) * 100 : 0;
  
  return {
    totalReferrals,
    activeReferrals,
    totalEarnings,
    pendingEarnings,
    paidEarnings,
    conversionRate
  };
}

// Get codes created today for rate limiting
export async function getCodesCreatedToday(userId: string): Promise<number> {
  console.log(`Checking codes created today for user ${userId}...`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();
  
  const codesCol = collection(db, "referralCodes");
  const q = query(codesCol, where("associatedUser", "==", userId), where("createdAt", ">=", todayISO));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.size;
}

// Get user referral history
export async function getUserReferralHistory(userId: string): Promise<{
  referralCodes: ReferralCode[];
  referralEarnings: ReferralEarning[];
}> {
  console.log(`Fetching referral history for user ${userId}...`);
  
  const [referralCodes, referralEarnings] = await Promise.all([
    getReferralCodes(), // Get user's referral codes
    getReferralEarnings(userId) // Get user's referral earnings
  ]);
  
  const userCodes = referralCodes.filter(code => code.associatedUser === userId);
  
  return {
    referralCodes: userCodes,
    referralEarnings
  };
}

// Get reviewer earnings (reviews + referrals)
export async function getReviewerEarnings(reviewerId: string): Promise<{
  totalEarnings: number;
  completedReviews: number;
  pendingEarnings: number;
  averageEarningPerReview: number;
  referralEarnings: number;
  totalEarningsWithReferrals: number;
}> {
  console.log(`Calculating earnings for reviewer ${reviewerId}...`);
  
  const [reviews, referralEarnings, submissions, reviewers] = await Promise.all([
    getReviewsByReviewer(reviewerId),
    getReferralEarnings(reviewerId),
    getSubmissions({ reviewerId }),
    getReviewers()
  ]);
  
  // Find the reviewer to get their packages
  const reviewer = reviewers.find(r => r.id === reviewerId);
  
  // Calculate real earnings based on actual submissions and packages
  let totalEarnings = 0; // in cents
  let pendingEarnings = 0; // in cents
  
  for (const submission of submissions) {
    const pkg = reviewer?.packages.find(p => p.id === submission.packageId);
    if (pkg) {
      // Check if this submission has been reviewed
      const hasReview = reviews.some(review => review.submissionId === submission.id);
      
      if (hasReview) {
        totalEarnings += pkg.priceInCents;
      } else if (submission.status === 'Pending Review') {
        pendingEarnings += pkg.priceInCents;
      }
    }
  }
  
  const completedReviews = reviews.length;
  const averageEarningPerReview = completedReviews > 0 ? totalEarnings / completedReviews : 0;
  
  // Calculate referral earnings (already in cents)
  const referralEarningsAmount = referralEarnings.reduce((sum, earning) => sum + earning.commissionAmount, 0);
  
  return {
    totalEarnings: totalEarnings / 100, // Convert to dollars for display
    completedReviews,
    pendingEarnings: pendingEarnings / 100, // Convert to dollars for display
    averageEarningPerReview: averageEarningPerReview / 100, // Convert to dollars for display
    referralEarnings: referralEarningsAmount, // Keep in cents for consistency with existing code
    totalEarningsWithReferrals: (totalEarnings + referralEarningsAmount) / 100 // Convert to dollars for display
  };
}

// Check if reviewer has submitted a review for a submission
export async function hasReviewerSubmittedReview(submissionId: string, reviewerId: string): Promise<boolean> {
  console.log(`Checking if reviewer ${reviewerId} has submitted review for submission ${submissionId}...`);
  
  const reviewsCol = collection(db, "reviews");
  const q = query(reviewsCol, where("reviewerId", "==", reviewerId), where("submissionId", "==", submissionId));
  const querySnapshot = await getDocs(q);
  
  return !querySnapshot.empty;
}

// Get submissions for admin view
export async function getSubmissionsForAdmin(): Promise<Submission[]> {
  console.log("Fetching all submissions for admin...");
  const submissionsCol = collection(db, "submissions");
  const q = query(submissionsCol, orderBy("submittedAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  const submissions = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Submission));
  
  return submissions;
}

// Submit review as admin
export async function submitReviewAsAdmin(
  submission: Submission,
  reviewData: any,
  overallScore: number,
  selectedReviewerId: string
): Promise<{ reviewId: string; reviewUrl: string }> {
  console.log("Submitting review as admin...");
  
  const reviewWithTimestamp: Omit<Review, 'id'> = {
    submissionId: submission.id,
    reviewerId: selectedReviewerId,
    scores: reviewData.scores || {},
    overallScore,
    strengths: reviewData.strengths || '',
    improvements: reviewData.improvements || '',
    summary: reviewData.summary || '',
    createdAt: new Date().toISOString(),
    submissionDetails: {
      artistName: submission.artistName,
      songTitle: submission.songTitle
    }
  };
  
  const docRef = await addDoc(collection(db, 'reviews'), reviewWithTimestamp);
  
  // Update submission status to 'Reviewed'
  const submissionRef = doc(db, "submissions", submission.id);
  await updateDoc(submissionRef, {
    status: 'Reviewed'
  });
  
  return {
    reviewId: docRef.id,
    reviewUrl: `/review/${docRef.id}`
  };
}

// Get review by ID
export async function getReviewById(reviewId: string): Promise<Review | null> {
  console.log(`Fetching review with ID: ${reviewId}`);
  
  const reviewRef = doc(db, "reviews", reviewId);
  const reviewDoc = await getDoc(reviewRef);
  
  if (!reviewDoc.exists()) {
    return null;
  }
  
  return {
    id: reviewDoc.id,
    ...reviewDoc.data()
  } as Review;
}

// Get referral tracking chain (for admin analytics)
export async function getReferralTrackingChain(userId: string): Promise<{
  referrer: User | null;
  referred: User[];
}> {
  console.log(`Getting referral tracking chain for user ${userId}...`);
  
  const users = await getUsers();
  const targetUser = users.find(u => u.id === userId);
  
  // Find who referred this user
  const referrer = targetUser?.referredBy ? users.find(u => u.id === targetUser.referredBy) || null : null;
  
  // Find who this user referred
  const referred = users.filter(u => u.referredBy === userId);
  
  return {
    referrer,
    referred
  };
}

// Development helper functions
export async function updateDatabaseWithRealUIDs(userMappings?: { [key: string]: string }): Promise<void> {
  console.log("Updating database with real UIDs...");
  // This is a development helper function - implementation would depend on specific needs
  // For now, just log the mapping
  console.log("User mappings:", userMappings || "No mappings provided");
}

export async function getCurrentUserInfo(): Promise<User | null> {
  console.log("Getting current user info...");
  
  if (!auth.currentUser) {
    return null;
  }
  
  const userRef = doc(db, "users", auth.currentUser.uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return null;
  }
  
  return {
    id: userDoc.id,
    ...userDoc.data()
  } as User;
}
