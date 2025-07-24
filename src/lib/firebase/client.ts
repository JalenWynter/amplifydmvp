/** @client */
// This file configures and initializes the client-side Firebase SDK.
// It reads configuration from environment variables and exports
// the necessary Firebase services (Auth, Firestore, Storage) for
// use throughout the application.

import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import type { Functions } from "firebase/functions";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Simple check to see if all required env vars are present
const areAllVarsPresent = 
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId;

if (!areAllVarsPresent) {
    throw new Error("Missing Firebase environment variables. Please check your .env.local file.");
}


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

import type { Functions } from "firebase/functions";

let functions: Functions | null = null; // Declare functions here

// Connect to emulators if in development mode
if (typeof window !== 'undefined') {
  if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST) {
    connectAuthEmulator(auth, `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`);
    console.log(`Connected to Auth Emulator: http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`);
  }
  if (process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST) {
    const [host, port] = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST.split(':');
    connectFirestoreEmulator(db, host, parseInt(port));
    console.log(`Connected to Firestore Emulator: http://${host}:${port}`);
  }
  if (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST) {
    const [host, port] = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST.split(':');
    connectStorageEmulator(storage, host, parseInt(port));
    console.log(`Connected to Storage Emulator: http://${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST}`);
  }

  // Initialize and connect to Functions Emulator only on client side
  functions = getFunctions(app);
  if (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST) {
    const [host, port] = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST.split(':');
    connectFunctionsEmulator(functions, host, parseInt(port));
    console.log(`Connected to Functions Emulator: http://${host}:${port}`);
  }
}

export { app, auth, db, storage, analytics };

export function getFirebaseFunctions(): Functions {
  if (typeof window === 'undefined') {
    throw new Error("Firebase Functions can only be initialized on the client side.");
  }
  // Ensure functions is initialized only once on the client
  if (!functions) {
    functions = getFunctions(app);
    if (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST) {
      const [host, port] = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST.split(':');
      connectFunctionsEmulator(functions, host, parseInt(port));
      console.log(`Connected to Functions Emulator: http://${host}:${port}`);
    }
  }
  return functions;
}