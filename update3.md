## Amplifyd Project Definition - update3.md

This document provides a comprehensive definition of the Amplifyd project, based on the current state of the codebase in the GitHub repository. It is intended to be a single source of truth for the project's architecture, features, and technical implementation.

### 1. Core Concept & Vision

Amplifyd is a two-sided marketplace designed to connect musicians with music industry professionals (reviewers) for paid, in-depth feedback on their work. The platform aims to provide a streamlined, transparent, and secure process for artists to get their music heard and for reviewers to monetize their expertise.

### 2. Technical Architecture

- **Framework**: Next.js 15 with React 18 and TypeScript, utilizing the App Router for routing and server-side rendering.
- **Styling**: A combination of global CSS (`src/app/globals.css`) and Tailwind CSS for utility-first styling. It also includes `shadcn/ui` for a pre-built component library, which is evident from the presence of `tailwind.config.ts` and `components.json`.
- **Backend**: Firebase is the primary backend, providing:
    - **Authentication**: Firebase Authentication for user management.
    - **Database**: Firestore for storing user data, submissions, and reviews.
    - **Storage**: Firebase Storage for hosting user-uploaded music files.
    - **Serverless Functions**: Firebase Functions for backend logic, such as processing payments and sending notifications.
- **Payments**: Stripe is integrated for handling payments for music reviews.
- **Deployment**: The project is configured for deployment on Firebase Hosting, with a CI/CD pipeline set up via GitHub Actions (`.github/workflows/firebase-hosting-pull-request.yml`).

### 3. Key Features & User Flows

#### 3.1. User Roles

- **Uploader (Musician)**: The default role for new users. They can submit music for review.
- **Reviewer**: Industry professionals who have been approved by an admin. They can create a public profile, set their own review prices, and get paid for their feedback.
- **Admin**: A superuser who can manage user roles, oversee submissions, and handle payouts.

#### 3.2. User Flows

- **Uploader Flow**:
    1.  Signs up for an account (or proceeds anonymously).
    2.  Browses reviewer profiles.
    3.  Selects a reviewer and submits a music track.
    4.  Pays for the review via Stripe.
    5.  Receives a tracking token to monitor the submission status.
    6.  Views the completed review.
- **Reviewer Flow**:
    1.  Applies to become a reviewer.
    2.  Once approved by an admin, they can create and manage their public profile.
    3.  They set their own review prices and provide their payment information.
    4.  They receive notifications of new submissions.
    5.  They access a private dashboard to listen to music and write reviews.
    6.  They submit the completed review, which triggers a notification to the admin for payout.
- **Admin Flow**:
    1.  Manages user roles.
    2.  Oversees all submissions and reviews.
    3.  Receives notifications when payouts are due.
    4.  Manually pays reviewers.

### 4. Codebase Structure

- **`src/app`**: Contains the Next.js App Router pages, including separate directories for different user roles (e.g., `admin`, `dashboard`).
- **`src/components`**: Reusable UI components, including a `ui` subdirectory for `shadcn/ui` components.
- **`src/lib`**: Core utility libraries, including Firebase configuration (`firebase/`), data type definitions (`types/`), and helper functions (`utils.ts`).
- **`src/functions`**: The source code for Firebase Functions.
- **`public`**: Static assets, such as images and fonts.
- **Configuration Files**: The project includes a number of configuration files, such as `firebase.json`, `next.config.ts`, and `tsconfig.json`.

### 5. Potential Areas for Improvement

- **Cloud Function Modularization**: The `functions/src/index.ts` file is monolithic and should be broken down into smaller, more focused functions.
- **State Management**: For a more complex application, a dedicated state management library like Redux or Zustand might be beneficial.
- **Automated Payouts**: The manual payout system is not scalable. Integrating an automated solution like Stripe Connect would be a significant improvement.
- **Testing**: The project currently lacks a comprehensive test suite. Adding unit and integration tests would improve code quality and reduce the risk of regressions.
