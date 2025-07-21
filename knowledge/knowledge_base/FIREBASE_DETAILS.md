# Firebase Details

This document provides detailed information about the Firebase services used in Amplifyd.

## Firebase Project Structure
- **Project ID**: `amplifydmvp` (as configured in `.firebaserc` and `firebase.json`)
- **Region**: `nam5` (for Firestore, as configured in `firebase.json`)

## Firebase Authentication
- **Providers**: Email/Password, Google Sign-In
- **Client-Side Integration**: `firebase/auth` SDK used in `src/lib/firebase/client.ts`.
- **Emulator Connection**: Configured to connect to `http://127.0.0.1:9099` in development via `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST`.
- **User Management**: Users are created and managed in the Firebase Auth service. Additional profile data is stored in the `users` Firestore collection.

## Cloud Firestore
- **Database**: NoSQL document database.
- **Collections**: 
    - `users`: Stores core user profiles (UID, email, name, role, status, joinedAt).
    - `reviewers`: Stores public-facing reviewer profiles and their packages.
    - `settings`: Stores global application configurations (e.g., `app-config`).
    - `applications`: Stores reviewer application submissions.
    - `referralCodes`: Manages referral codes for the affiliate system.
    - `referralEarnings`: Tracks earnings generated from referrals.
    - `submissions`: Stores details of music submissions from artists.
    - `reviews`: Stores detailed feedback provided by reviewers.
    - `transactions`: Records payment transaction details.
    - `payouts`: Manages payouts to reviewers.
- **Security Rules**: Defined in `firestore.rules.production` (and `firestore.rules` for development if used).
    - Rules enforce read/write access based on user authentication and roles.
    - Emulator rules are deployed via `firebase deploy --only firestore:rules`.
- **Persistence**: Configured in `firebase.json` to persist emulator data to `.firebase/firestore`.
- **Client-Side Integration**: `firebase/firestore` SDK used in `src/lib/firebase/client.ts` and `src/lib/firebase/services.ts`.
- **Emulator Connection**: Configured to connect to `http://127.0.0.1:8080` in development via `NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST`.

## Cloud Storage
- **Purpose**: Stores media files, primarily audio submissions.
- **Buckets**: Uses the default bucket associated with the Firebase project.
- **Paths**: Primarily `/submissions/` for uploaded audio files.
- **Security Rules**: Defined in `storage.rules`.
- **Client-Side Integration**: `firebase/storage` SDK used in `src/lib/firebase/client.ts` and `src/lib/firebase/services.ts`.
- **Emulator Connection**: Configured to connect to `http://127.0.0.1:9199` in development via `NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST`.

## Cloud Functions
- **Source**: `src/functions`.
- **Runtime**: Node.js 18.
- **Purpose**: Backend logic for secure operations (e.g., `approveApplication`, `countDocuments`).
- **Deployment**: Deployed via `firebase deploy --only functions`.
- **Emulator Connection**: Configured to connect to `http://127.0.0.1:5001` in development via `NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST`.

## Firebase Hosting
- **Purpose**: Serves the Next.js application.
- **Source**: `.` (project root).
- **Public Directory**: `.next` (after `npm run build`).
- **Deployment**: Deployed via `firebase deploy --only hosting`.
- **Emulator Connection**: Served on `http://localhost:5000` by default.

## Firebase Emulator Suite
- **Components Used**: Auth, Firestore, Functions, Hosting, Storage.
- **Configuration**: Defined in `firebase.json`.
- **Persistence**: Enabled for Firestore to retain data across emulator restarts.
- **Usage**: Essential for local development and testing without affecting production data or incurring costs.
