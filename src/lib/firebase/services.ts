
// This file will contain all the functions to interact with Firebase services (Firestore, Storage, etc.)
import { collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, query, orderBy, where, arrayUnion, arrayRemove, writeBatch, limit, deleteDoc, getCountFromServer } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "./client";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ReviewFormValues } from "@/components/review/scoring-chart";

// Define TypeScript interfaces for our data structures
export interface AppSettings {
  applicationMode: 'invite-only' | 'open';
}
export interface ReviewPackage {
  id: string;
  name: string;
  priceInCents: number;
  description: string;
  trackCount: number;
  formats: ('chart' | 'written' | 'audio' | 'video')[];
}

export interface Reviewer {
  id: string;
  name: string;
  genres: string[];
  turnaround: string;
  experience: string;
  avatarUrl: string;
  dataAiHint?: string;
  packages: ReviewPackage[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Reviewer' | 'Artist';
  status: 'Active' | 'Suspended' | 'Banned';
  joinedAt: string; // ISO String
  avatarUrl?: string;
}

export interface Application {
  id:string;
  name: string;
  email: string;
  status: 'Pending Review' | 'Approved' | 'Rejected' | 'Needs More Info';
  primaryRole: string;
  portfolioLink: string;
  musicBackground: string;
  joinReason: string;
  referral: string;
  submittedAt: string;
  userId: string;
}

export interface PayoutReview {
    id: string;
    artist: string;
    song: string;
    date: string;
    fee: number;
}

export interface Payout {
    id: string;
    reviewer: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string;
    };
    amount: string;
    status: 'Pending' | 'In-Transit' | 'Paid';
    date: string; // Request date
    paidDate?: string; // Paid date
    paymentMethod: string;
    reviews: PayoutReview[];
}

export interface Submission {
  id: string;
  artistName: string;
  songTitle: string;
  genre: string; 
  contactEmail: string;
  status: 'Pending Review' | 'In Progress' | 'Reviewed';
  submittedAt: string;
  audioUrl: string;
  reviewerId: string;
  packageId: string;
}

export interface Review {
    id: string;
    submissionId: string;
    reviewerId: string;
    scores: { [key: string]: number };
    overallScore: number;
    strengths: string;
    improvements: string;
    summary: string;
    createdAt: string;
    // Added for display on the reviews list page
    submissionDetails: {
      artistName: string;
      songTitle: string;
    }
}

export interface ReferralCode {
  id: string;
  code: string;
  associatedUser: string;
  status: 'Active' | 'Used' | 'Expired';
  createdAt: string; // ISO String
}

export interface DashboardStats {
    totalUsers: number;
    totalReviewers: number;
    totalSubmissions: number;
    completedReviews: number;
}

export interface FinancialStats {
    totalRevenue: number;
    avgRevenuePerUser: number;
    pendingPayouts: number;
    pendingPayoutsCount: number;
    totalUsers: number;
}

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
        const defaultSettings: AppSettings = { applicationMode: 'invite-only' };
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

export async function updateApplicationStatus(id: string, status: 'Approved' | 'Rejected'): Promise<void> {
    console.log(`Updating application ${id} status to ${status}`);
    const appRef = doc(db, "applications", id);
    const appSnap = await getDoc(appRef);
    if (!appSnap.exists()) {
        throw new Error("Application not found.");
    }
    const appData = appSnap.data() as Application;

    const batch = writeBatch(db);
    batch.update(appRef, { status: status });

    if (status === 'Approved') {
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
    return { id: docSnap.id, ...doc.data() } as Payout;
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
    if (settings.applicationMode === 'invite-only') {
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

        if (codeData.status !== 'Active') {
            throw new Error("This invite code is no longer active.");
        }

        const expiryDate = new Date(new Date(codeData.createdAt).getTime() + 24 * 60 * 60 * 1000);
        if (new Date() > expiryDate) {
            await updateDoc(doc(db, "referralCodes", codeDoc.id), { status: 'Expired' });
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
        status: 'Pending Review' as const,
        submittedAt: new Date().toISOString(),
    };

    const appDocRef = doc(collection(db, "applications"));
    batch.set(appDocRef, appWithDetails);
    
    // 3. Create a corresponding user document in the 'users' collection
    const userDoc: Omit<User, 'id'> = {
        name: applicationData.name,
        email: applicationData.email,
        role: 'Reviewer', // Default role upon application
        status: 'Active', // User is active, but application is pending
        joinedAt: new Date().toISOString(),
        avatarUrl: '' // Can be set later
    }
    const userDocRef = doc(db, "users", user.uid);
    batch.set(userDocRef, userDoc);

    // 4. If an invite code was used and valid, mark it as 'Used'
    if (settings.applicationMode === 'invite-only' && applicationData.referral) {
        const codesRef = collection(db, "referralCodes");
        const q = query(codesRef, where("code", "==", applicationData.referral), limit(1));
        const codeSnapshot = await getDocs(q);
        if (!codeSnapshot.empty) {
            const codeRef = codeSnapshot.docs[0].ref;
            batch.update(codeRef, { status: "Used" });
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
    status: 'Pending Review' as const,
    submittedAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, "submissions"), submissionWithDetails);

  return { ...submissionWithDetails, id: docRef.id };
}

export async function getSubmissions(options: { all?: boolean } = {}): Promise<Submission[]> {
  console.log(`Fetching submissions from Firestore (all: ${!!options.all})...`);
  const submissionsCol = collection(db, "submissions");
  
  const queryConstraints = [orderBy("submittedAt", "desc")];
  if (!options.all) {
      queryConstraints.unshift(where("status", "==", "Pending Review"));
  }
  
  const q = query(submissionsCol, ...queryConstraints);
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
): Promise<void> {
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
    batch.update(submissionRef, { status: "Reviewed" });
    
    await batch.commit();

    console.log(`Review submitted for submission ${submission.id}`);
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
        status: 'Active',
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
  seedBatch.set(doc(db, "settings", "app-config"), { applicationMode: 'invite-only' });

  // Seed Users
  const usersToSeed: Omit<User, 'id'>[] = [
    { name: 'Admin User', email: 'jwynterthomas@gmail.com', role: 'Admin', status: 'Active', joinedAt: new Date('2024-05-01').toISOString(), avatarUrl: 'https://placehold.co/40x40.png' },
    { name: 'Brenda "Vocals" Lee', email: 'brenda.lee@amplifyd.com', role: 'Reviewer', status: 'Active', joinedAt: new Date('2024-06-15').toISOString(), avatarUrl: 'https://placehold.co/40x40.png' },
    { name: 'Alex "Synth" Chen', email: 'alex.chen@amplifyd.com', role: 'Reviewer', status: 'Active', joinedAt: new Date('2024-06-20').toISOString(), avatarUrl: 'https://placehold.co/40x40.png' },
    { name: 'Cosmic Dreamer', email: 'cosmic@dreamer.com', role: 'Artist', status: 'Active', joinedAt: new Date('2024-07-28').toISOString(), avatarUrl: 'https://placehold.co/40x40.png' }
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
      { userId: 'new_user_id_1', name: 'John Doe', email: 'john.doe@example.com', status: 'Pending Review', primaryRole: 'Producer / Engineer', portfolioLink: 'https://linkedin.com/in/johndoeproducer', musicBackground: "With over 15 years in the industry, I've worked on multiple gold-certified records.", joinReason: "I'm passionate about discovering new talent and helping artists refine their sound.", referral: "", submittedAt: new Date('2024-07-28').toISOString() },
      { userId: 'new_user_id_2', name: 'Jane Smith', email: 'jane.smith@music.com', status: 'Pending Review', primaryRole: 'A&R', portfolioLink: 'https://janesmithmusic.com', musicBackground: "As an A&R for a prominent indie label, I've signed and developed several successful artists.", joinReason: "I'm looking to broaden my network and find raw talent outside of the usual channels.", referral: "", submittedAt: new Date('2024-07-27').toISOString() },
  ];
  applicationsToSeed.forEach(app => {
      seedBatch.set(doc(collection(db, "applications")), app);
  });

  // Seed Payouts
  const payoutsToSeed: Omit<Payout, 'id'>[] = [
    {
        reviewer: { id: 'reviewer_user_01', name: 'Brenda "Vocals" Lee', email: 'brenda.lee@amplifyd.com', avatarUrl: 'https://placehold.co/40x40.png' },
        amount: '$450.00', status: 'Paid', date: '2024-07-15T00:00:00.000Z', paidDate: '2024-07-18T00:00:00.000Z', paymentMethod: 'PayPal',
        reviews: [ { id: 'rev_01', artist: 'Cosmic Dreamer', song: 'Starlight Echoes', date: '2024-07-10T00:00:00.000Z', fee: 25.00 }]
    },
    {
        reviewer: { id: 'reviewer_user_02', name: 'Alex "Synth" Chen', email: 'alex.chen@amplifyd.com', avatarUrl: 'https://placehold.co/40x40.png' },
        amount: '$75.00', status: 'Pending', date: '2024-08-01T00:00:00.000Z', paymentMethod: 'Stripe Connect',
        reviews: [ { id: 'rev_03', artist: 'Lofi Beats', song: 'Chill Waves', date: '2024-07-28T00:00:00.000Z', fee: 15.00 }]
    }
  ];
   payoutsToSeed.forEach(payout => {
      seedBatch.set(doc(collection(db, "payouts")), payout);
  });

  // Seed Referral Codes
  const referralCodesToSeed: Omit<ReferralCode, 'id'>[] = [
    { code: 'INVITE-USED123', associatedUser: 'brenda.lee@amplifyd.com', status: 'Used', createdAt: new Date('2024-07-20').toISOString() },
    { code: 'INVITE-ACTIVE456', associatedUser: 'alex.chen@amplifyd.com', status: 'Active', createdAt: new Date().toISOString() },
    { code: 'INVITE-EXPIRED789', associatedUser: 'admin.user@amplifyd.com', status: 'Expired', createdAt: new Date('2024-07-01').toISOString() }
  ];
  referralCodesToSeed.forEach(code => {
    seedBatch.set(doc(collection(db, "referralCodes")), code);
  });


  await seedBatch.commit();
  console.log("Database seeding completed successfully.");
}
