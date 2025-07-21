## Amplifyd Project Update 2: Reviewer Flow Architecture

This document outlines the architecture for the reviewer's journey on the Amplifyd platform, from signing up to getting paid for their reviews.

### 1. User Stories

- As a reviewer, I want to be able to apply to join the platform so that I can start reviewing music.
- As a reviewer, I want to be able to create and manage my public profile so that I can attract musicians to submit their music to me.
- As a reviewer, I want to be able to set my own prices for reviews so that I can be compensated fairly for my time and expertise.
- As a reviewer, I want to be able to manage my payment information so that I can receive payouts from the admin.
- As a reviewer, I want to be able to view and manage my pending review submissions so that I can keep track of my work.
- As a reviewer, I want to be able to listen to submitted music and write a review so that I can provide feedback to the musician.
- As a reviewer, I want to be able to see my total earnings and total paid amounts so that I can track my income from the platform.

### 2. Data Models

We will need to update our Firestore data models to support the reviewer flow. Here are the proposed changes:

**`users` collection:**

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'uploader' | 'reviewer' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string; // ISO 8601 date string
}
```

**`reviewers` collection:**

```typescript
interface Reviewer {
  id: string; // Same as the user ID
  bio?: string;
  genres?: string[];
  turnaroundTime?: number; // in days
  reviewRate: number;
  totalEarnedString: string;
  totalPaidString: string;
  portfolioLinks?: string[];
  manualPaymentInfoString?: string; // For admin reference
}
```

**`submissions` collection:**

```typescript
interface Submission {
  id: string;
  uploaderId?: string; // Optional for anonymous uploads
  uploaderEmail: string;
  reviewerId: string;
  songUrl: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  submittedAt: string; // ISO 8601 date string
  reviewedAt?: string; // ISO 8601 date string
  paymentIntentId: string;
  trackingToken: string;
}
```

**`reviews` collection:**

```typescript
interface Review {
  id: string;
  submissionId: string;
  reviewerId: string;
  rating: number; // 1-10
  feedback: string;
  createdAt: string; // ISO 8601 date string
}
```

### 3. API Endpoints

We will need to create the following API endpoints to support the reviewer flow:

- `POST /api/reviewers`: Create a new reviewer profile.
- `PUT /api/reviewers/:id`: Update a reviewer's profile.
- `GET /api/reviewers/:id/submissions`: Get a list of a reviewer's pending submissions.
- `POST /api/submissions/:id/reviews`: Submit a new review.

### 4. Error Handling

We need to ensure that we have robust error handling in place for the reviewer flow. Here are some potential errors we need to account for:

- A user tries to create a reviewer profile without the "reviewer" role.
- A reviewer tries to update another reviewer's profile.
- A reviewer tries to submit a review for a submission that is not assigned to them.
- A reviewer tries to submit a review for a submission that has already been reviewed.

We will use a combination of Firestore security rules and server-side validation to prevent these errors from occurring.