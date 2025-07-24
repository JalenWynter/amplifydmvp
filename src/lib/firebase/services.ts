// This file serves as a central re-export point for all client-side Firebase services and types.

// Import and re-export functions from individual service modules
// Note: Some functions might be callable functions and reside in functions/src/callable
// We are only re-exporting client-side functions here.

// From applications.ts
export { addApplication, getApplications, getApplicationById, rejectApplication } from './applications';

// From payouts.ts
export { getPayouts, createPayout, updatePayoutStatus, getPayoutById } from './payouts';

// From referrals.ts
export { getReferralEarnings, getUserReferralHistory, createReferralCode, getCodesCreatedToday, getReferralStats, getReferralCodes, getAllReferralCodes, getReferralTrackingChain } from './referrals';

// From reviews.ts
export { submitReview, getReviewsByReviewer, getAllReviews, getReviewById, hasReviewerSubmittedReview, submitReviewAsAdmin } from './reviews';

// From submissions.ts
export { uploadMusicFile, getSubmissions, getSubmissionById, getSubmissionStatusByToken, getSubmissionsForAdmin, updateSubmissionStatus, assignReviewerToSubmission } from './submissions';


// From transactions.ts
export { createTransaction, getTransactions, getTransactionStats, getTransactionBySessionId, updateTransactionStatus } from './transactions';

// From users.ts
export { getUsers, getCurrentUserInfo, approveApplication } from './users';

// From reviewers.ts
export { getReviewers, getReviewerById, updateReviewerProfile, addPackage, updatePackage, deletePackage } from './reviewers';

// From images.ts
export { uploadImage } from './images';
export { uploadFile } from './storage';

// From feedback.ts
export { uploadAudioFeedback, uploadVideoFeedback } from './feedback';

// From activity.ts
export { logActivityEvent, getRecentActivityEvents } from './activity';

// From dev-setup.ts
export { seedDatabase, updateDatabaseWithRealUIDs } from './dev-setup';


// From admin/users.ts
export { updateUserRole, updateUserStatus } from './admin/users';

// From admin/dashboard.ts
export { getDashboardStats, getFinancialStats } from './admin/dashboard';

// Original content of getAppSettings and updateAppSettings (kept here for now)
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./client";
import { AppSettings, APPLICATION_MODE } from '../constants';
import { AppSettingsSchema } from '../types';

let cachedSettings: AppSettings | null = null;

export async function getAppSettings(): Promise<AppSettings> {
    if (cachedSettings) {
        return cachedSettings;
    }
    const settingsRef = doc(db, "settings", "app-config");
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
        const parsedSettings = AppSettingsSchema.parse(docSnap.data());
        cachedSettings = parsedSettings;
        return parsedSettings;
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