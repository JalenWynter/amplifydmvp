// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK to perform privileged operations
// like minting custom tokens, managing users, or accessing data
// with elevated permissions, bypassing security rules.

/*
================================================================================
IMPORTANT: HOW TO SET UP YOUR FIREBASE ADMIN CREDENTIALS
================================================================================
This application uses a Base64-encoded service account key for security and reliability.

1.  Find your Service Account JSON file in your Firebase project settings.
2.  Encode the *entire content* of that JSON file into a single Base64 string.
    - You can use an online tool or a command line utility:
      `cat /path/to/your/service-account.json | base64` (on macOS/Linux)
3.  Copy the resulting Base64 string.
4.  In your `.env.local` file, set the `FIREBASE_SERVICE_ACCOUNT_BASE64` variable
    to this Base64 string.

    Example `.env.local`:
    FIREBASE_SERVICE_ACCOUNT_BASE64=ewoicHJ...J9Cg==
================================================================================
*/

import * as admin from 'firebase-admin';
import type { AppSettings, User } from './services';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from './client';

function initializeAdminApp() {
    // Return early if the app is already initialized to avoid errors.
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (!serviceAccountBase64) {
        console.warn('WARNING: FIREBASE_SERVICE_ACCOUNT_BASE64 is not set. Firebase Admin SDK is not initialized. Server-side functionality will be limited.');
        return null;
    }

    if (!storageBucket) {
        console.warn('WARNING: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set. Firebase Admin SDK is not initialized.');
        return null;
    }

    try {
        // Decode the Base64 string to get the JSON content
        const decodedServiceAccount = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(decodedServiceAccount);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: storageBucket,
        });

        console.log('Firebase Admin SDK initialized successfully.');
    } catch (error: unknown) {
        console.error('Firebase admin initialization error:', error instanceof Error ? error.message : String(error));
        // Throw a more descriptive error to help with debugging
        throw new Error(`Failed to initialize Firebase Admin SDK. Error: ${error instanceof Error ? error.message : String(error)}. Please ensure FIREBASE_SERVICE_ACCOUNT_BASE64 is a valid Base64-encoded service account key.`);
    }

    return admin.app();
}

// Getter functions to ensure initialization before use
function getAdminDb() {
    if (!initializeAdminApp()) return null;
    return admin.firestore();
}

function getAdminAuth() {
    if (!initializeAdminApp()) return null;
    return admin.auth();
}

function getAdminStorage() {
    if (!initializeAdminApp()) return null;
    return admin.storage();
}

// SERVER-SIDE: For use in Server Components & API Routes
export async function getAppSettingsAdmin(): Promise<AppSettings> {
    const dbAdmin = getAdminDb();
    if (!dbAdmin) {
      console.warn("Admin SDK not initialized. Falling back to default settings for getAppSettingsAdmin.");
      return { applicationMode: 'invite-only' }; // Return default value
    }
    const settingsRef = dbAdmin.collection("settings").doc("app-config");
    const docSnap = await settingsRef.get();
    if (docSnap.exists) {
        return docSnap.data() as AppSettings;
    } else {
        const defaultSettings: AppSettings = { applicationMode: 'invite-only' };
        await settingsRef.set(defaultSettings);
        return defaultSettings;
    }
}


export async function updateUserStatusAdmin(userId: string, status: User['status']): Promise<void> {
    console.log(`Updating user ${userId} status to ${status}`);
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
        throw new Error("Admin SDK not initialized. Cannot update user status.");
    }
    const userRef = doc(db, "users", userId);
    const batch = writeBatch(db);
    batch.update(userRef, { status: status });

    // Also update the user's disabled status in Firebase Auth
    await adminAuth.updateUser(userId, {
        disabled: status === 'Suspended',
    });
    
    await batch.commit();
    console.log(`Successfully updated user ${userId} status to ${status} in Firestore and Auth.`);
}


// Export the getter functions if they need to be used elsewhere
export { getAdminDb, getAdminAuth, getAdminStorage };
