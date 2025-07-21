
# Amplifyd: Production & Deployment Guide

This document is your comprehensive guide to testing, deploying, and managing the Amplifyd application.

## Current Development Status

As of the latest development, the Firebase Emulator Suite is fully configured and integrated with the Next.js application. This includes:

-   **Firestore Emulator Persistence:** Data written to the Firestore emulator now persists across emulator restarts.
-   **Client-Side Emulator Connection:** The Next.js application correctly connects to the Auth, Firestore, and Storage emulators for local development.
-   **Firebase Security Rules:** Firestore rules (`firestore.rules.production`) have been updated to allow authenticated users to create their own user and reviewer profiles.
-   **Data Seeding:** A `scripts/seedFirestore.js` script is available to populate all necessary Firestore collections with sample data for comprehensive testing of roles, permissions, and site functionality.
-   **Auth Emulator Seeding:** Users can be created directly in the Firebase Auth Emulator UI or via the `scripts/seedAuthUsers.js` script to enable full authentication testing.

This setup ensures a robust and isolated local development environment for all features.

---

## 1. Project Overview

Amplifyd is a two-sided marketplace connecting music artists with industry professionals (reviewers) for detailed, paid feedback.

-   **Artists**: Submit tracks, choose a reviewer and package, and receive structured feedback.
-   **Reviewers**: Create a public profile, define service packages, review submitted tracks, and manage earnings.
-   **Admins**: Oversee platform activity, manage user applications, process payouts, and view platform statistics.

---

## 2. Technical Architecture & Data Flow

### Key Technologies:
-   **Framework**: Next.js (with App Router)
-   **UI**: React, Tailwind CSS, ShadCN UI
-   **Database**: Google Firestore
-   **Authentication**: Firebase Authentication
-   **File Storage**: Firebase Storage
-   **Payments**: Stripe
-   **AI (Future)**: Google AI & Genkit

### Data Flow Diagram

```mermaid
graph TD
    subgraph Artist Journey
        A[Artist visits Amplifyd] --> B{Fills Submission Form};
        B --> C[Uploads MP3 to Firebase Storage];
        C --> D{Chooses Reviewer/Package};
        D --> E[Create Stripe Checkout Session];
        E --> F((Stripe Payment Page));
        F --> G((Stripe Webhook));
    end

    subgraph Backend & Reviewer
        G --> H[API Route: /api/webhooks/stripe];
        H --> I[Create Submission document in Firestore];
        I --> J[Reviewer sees new Submission in Dashboard];
        J --> K{Reviewer completes Review Form};
        K --> L[Create Review document in Firestore];
        L --> M[Update Submission status to "Reviewed"];
    end

    subgraph Admin & Payouts
        N[Reviewer accrues earnings] --> O{Admin creates Payout};
        O --> P[Create Payout document in Firestore];
        P --> Q[Admin marks Payout as "Paid"];
        Q --> R[Update Payout document in Firestore];
    end

    A --> Z[Views Public Reviewer Pages];
    Z --> I_DB[(Firestore 'reviewers' Collection)];
```

---

## 3. GitHub Setup: Pushing Your Code for the First Time

Follow these steps precisely in your terminal to get your project onto GitHub.

### Step 1: Generate a New SSH Key

This creates a secure connection key for GitHub.

```bash
# This command creates a new SSH key. Press Enter three times to accept the defaults.
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

### Step 2: Add the SSH Key to Your GitHub Account

1.  **Display the new key.** Run the command below to show your public key.
    ```bash
    cat ~/.ssh/id_rsa.pub
    ```
2.  **Copy the key.** Select the entire output, which starts with `ssh-rsa` and ends with your email.
3.  **Go to GitHub's SSH settings page:** [github.com/settings/keys](https://github.com/settings/keys)
4.  Click **"New SSH key"**.
5.  Give it a **Title** (e.g., "Firebase Studio Key").
6.  Paste the key you copied into the **"Key"** text box.
7.  Click **"Add SSH key"**.

### Step 3: Push Your Code to the Repository

Now, run these commands in your terminal one-by-one.

```bash
# Initialize a local Git repository
git init -b main

# Add all project files
git add .

# Create the first commit
git commit -m "Initial commit of Amplifyd platform"

# Connect to your GitHub repository using the new SSH method
git remote add origin git@github.com:JalenWynter/amplifydmvp.git

# Push your code to GitHub
git push -u origin main
```

After running `git push`, you may see a one-time message asking `Are you sure you want to continue connecting (yes/no)?`. Type **`yes`** and press Enter. Your files will then be uploaded to GitHub.

---

## 4. Firebase & Stripe Configuration

### Firestore Collections:

| Collection Name   | Purpose                                                                 | Key Data Fields                                        |
| ----------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| `users`           | Stores all registered users (Admins, Reviewers, Artists).               | `name`, `email`, `role`, `status`, `joinedAt`          |
| `reviewers`       | Public profiles for verified reviewers.                                 | `name`, `genres`, `experience`, `packages`, `avatarUrl`|
| `applications`    | Stores applications from users wanting to become reviewers.             | `name`, `email`, `status`, `userId`, `submittedAt`     |
| `submissions`     | Tracks every music submission from artists.                             | `artistName`, `songTitle`, `audioUrl`, `reviewerId`    |
| `reviews`         | Stores the detailed feedback provided by reviewers.                     | `submissionId`, `reviewerId`, `overallScore`, `scores` |
| `payouts`         | Records of payments made to reviewers.                                  | `reviewer`, `amount`, `status`, `date`, `paidDate`     |
| `referralCodes`   | Single-use codes for tracking reviewer recruitment.                     | `code`, `status`, `createdAt`, `associatedUser`        |

### Firebase Storage Buckets:

-   A single bucket is used, as defined by `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.
-   **Path**: `/submissions/`
-   **Purpose**: Stores all MP3 and WAV files uploaded by artists. Files are named with a timestamp to prevent collisions.

### Key Application Routes:

| Path                            | Role       | Purpose                                             |
| ------------------------------- | ---------- | --------------------------------------------------- |
| `/`                             | Artist     | Homepage & Main Submission Form                     |
| `/features`                     | Public     | Lists all public, verified reviewers                |
| `/reviewers/[id]`               | Public     | Detailed public profile for a specific reviewer     |
| `/apply`                        | Public     | Application form for new reviewers                  |
| `/login`                        | Reviewer   | Login page for reviewers and admins                 |
| `/dashboard`                    | Reviewer   | Main dashboard with stats and recent submissions    |
| `/dashboard/profile`            | Reviewer   | Edit public profile and manage review packages      |
| `/dashboard/review/[submissionId]`| Reviewer   | The dedicated interface for completing a review     |
| `/admin`                        | Admin      | Main dashboard with platform-wide statistics        |
| `/admin/applications`           | Admin      | View and manage reviewer applications               |
| `/admin/financials/payouts`     | Admin      | View and manage reviewer payouts                    |
| `/api/webhooks/stripe`          | System     | Stripe webhook endpoint to confirm successful payments|

---

## 5. Step-by-Step Guide: From Sandbox to Live Deployment

This guide assumes you have Node.js, `npm`, and a code editor (like VS Code) installed.

### **Phase 1: Local Environment Setup & Final Testing**

**Goal**: Test the full payment flow using the Stripe CLI.

1.  **Download the Code**:
    *   **Note:** This action is performed within the Firebase Studio user interface, not on the command line.
    *   Use the **"Download"** or "Export" button in Firebase Studio to get a ZIP of the project.
    *   Unzip it to a folder on your local machine.

2.  **Install Dependencies**:
    *   Open a terminal in the project folder and run: `npm install`

3.  **Set Up Environment Variables**:
    *   In the project root, create a file named `.env.local`.
    *   **Crucially, never commit this file to a public repository.**
    *   Copy the content below into `.env.local` and fill in your actual keys. You can find these in your Firebase and Stripe dashboards.

    ```bash
    # Firebase Client SDK Config (Firebase Console > Project Settings > General)
    NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=amplifydmvp.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=amplifydmvp
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=amplifydmvp.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=1:486875334710:web:...

    # Stripe Config (Stripe Dashboard > Developers > API Keys)
    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_... # You will get this in the next step
    ```

4.  **Test Stripe Webhooks Locally**:
    *   **Install the Stripe CLI** on your computer if you've not already.
    *   **Run the local dev server**: In your terminal, run `npm run dev`. The app will start on `http://localhost:9002`.
    *   **Forward events to your app**: Open a *new* terminal window and run:
        ```bash
        stripe listen --forward-to localhost:9002/api/webhooks/stripe
        ```
    *   The Stripe CLI will output a webhook signing secret (it starts with `whsec_...`). Copy this value and paste it into `.env.local` for the `STRIPE_WEBHOOK_SECRET` variable.
    *   **Test the full flow**: Go to `http://localhost:9002`. Submit a track, proceed to Stripe, and use a [Stripe test card](https://stripe.com/docs/testing) to pay. You should see events in the Stripe CLI terminal, and a new document should appear in your Firestore `submissions` collection.

5.  **Seed Your Database for Testing**:
    *   **Run the Firestore Seeding Script**: In a terminal, navigate to your project's root directory (`amplifydmvp`) and run:
        ```bash
        node scripts/seedFirestore.js
        ```
        This will populate your Firestore emulator with sample data for users, reviewers, submissions, etc.
    *   **Seed Auth Emulator Users**: If you haven't already, create test users directly in the Firebase Auth Emulator UI (`http://localhost:4000/auth`). Ensure the UIDs match those used in `scripts/seedFirestore.js` (e.g., `admin_user_01`, `reviewer_user_01`). Alternatively, you can use the `scripts/seedAuthUsers.js` script.

### **Phase 2: Firebase Project Deployment**

**Goal**: Get your application and its security rules live on the internet.

1.  **Install Firebase CLI**: If you don't have it, run: `npm install -g firebase-tools`.
2.  **Login and Initialize**:
    *   Run `firebase login` to authenticate with your Google account.
    *   Run `firebase init` in your project's root directory.
    *   Use the arrow keys to select features. Choose **Firestore** and **Hosting**.
    *   Select "Use an existing project" and pick `amplifydmvp` from the list.
    *   **Firestore**: It will ask for your rules file. The default is `firestore.rules`. Press Enter. It will also ask for your indexes file; you can press Enter to accept the default `firestore.indexes.json`.
    *   **Hosting**: For the public directory, enter **`.next`**. This is critical for Next.js apps. Configure as a single-page app (SPA): **No**. Set up automatic builds with GitHub: **No** (you can do this later).

3.  **Deploy Everything**:
    *   First, build your application for production:
        ```bash
        npm run build
        ```
    *   Now, deploy your Firestore rules, security indexes, and the hosted web app in one command:
        ```bash
        firebase deploy
        ```
    *   After the command finishes, it will give you a "Hosting URL". This is your live website!

### **Phase 3: Post-Launch & Roadmap**

You are now live! Here are some potential next steps and feature enhancements to consider for future versions.

*   **Roadmap - V1.1 (Enhancements)**
    *   **Email Notifications**: Implement the email flows outlined in `EMAIL_SETUP.md` (e.g., "Application Approved," "Review Complete").
    *   **Artist Accounts**: Allow artists to create accounts to track their submission history.
    *   **Admin User Management**: Implement the "Edit User" and "Suspend User" actions in the admin user list.
    *   **Dynamic Charts**: Wire up the admin dashboard charts to display real historical data from Firestore.

*   **Roadmap - V2.0 (AI Integration)**
    *   **AI-Powered Feedback Summary**: Use a Genkit flow to generate an initial summary of a review based on the reviewer's scores and written feedback, which the reviewer can then edit.
    *   **Genre Suggestion**: Use an AI model to analyze an uploaded track and suggest the most appropriate genre.
    *   **"Sounds Like" Feature**: Use AI to compare a submitted track to well-known artists to help reviewers understand its sonic profile.

Congratulations! You have a solid foundation for a successful platform. Good luck with the launch!

## 🔧 **Manual CORS Fix (Critical - Do This First):**

**Option 1: Using Google Cloud Console (Recommended)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project "amplifydmvp"
3. Navigate to **Storage → Browser**
4. Click on your bucket `amplifydmvp.firebasestorage.app`
5. Go to **Permissions** tab
6. Click **Add** and add these origins:
   - `http://localhost:9002`
   - `https://amplifydmvp.web.app`
7. Set methods: `GET, POST, PUT, DELETE, OPTIONS`

**Option 2: Using Firebase CLI (if the above doesn't work)**
```bash
<code_block_to_apply_changes_from>
```

---

## 📊 **Step 2: Add Transaction Tracking to Your Existing System**

Let me add transaction tracking to your existing financials structure without creating new files:
