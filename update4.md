## Amplifyd Project Definition - update4.md

This document outlines the architecture for the reviewer's end-to-end flow, from signing up to completing music submissions and managing their profile.

### 1. User Stories

- As a potential reviewer, I want to be able to apply to join the platform.
- As a reviewer, I want to be able to create and manage my public profile, including my bio, photo, genres, and links to my work.
- As a reviewer, I want to be able to set my own prices for reviews.
- As a reviewer, I want to be able to provide my payment information for manual payouts.
- As a reviewer, I want to be able to see a list of my pending review submissions.
- As a reviewer, I want to be able to listen to submitted music and write a review.
- As a reviewer, I want to be able to track my earnings and payouts.

### 2. Data Models

We will use the following Firestore data models to support the reviewer flow:

- **`users` collection**: Stores basic user information, including their role.
- **`reviewers` collection**: Stores reviewer-specific information, such as their bio, review prices, and payment information.
- **`submissions` collection**: Stores information about each music submission, including the uploader, reviewer, and status.
- **`reviews` collection**: Stores the completed reviews.

### 3. UI/UX Flow

1.  **Application**: A potential reviewer fills out an application form.
2.  **Approval**: An admin reviews the application and approves it, which triggers a Cloud Function to assign the "reviewer" role to the user.
3.  **Profile Creation**: The new reviewer is prompted to create their public profile.
4.  **Dashboard**: The reviewer is taken to their dashboard, where they can see a list of their pending submissions.
5.  **Reviewing**: The reviewer clicks on a submission to listen to the music and write a review.
6.  **Submission**: The reviewer submits the completed review, which updates the submission status and notifies the admin that a payout is due.
7.  **Profile Management**: The reviewer can update their profile information at any time from their dashboard.

### 4. API Endpoints

We will need the following API endpoints to support the reviewer flow:

- `POST /api/applications`: Submit a new reviewer application.
- `POST /api/reviewers`: Create a new reviewer profile.
- `PUT /api/reviewers/:id`: Update a reviewer's profile.
- `GET /api/reviewers/:id/submissions`: Get a list of a reviewer's pending submissions.
- `POST /api/submissions/:id/reviews`: Submit a new review.

### 5. Error Handling

We will implement robust error handling to ensure a smooth user experience. This includes:

- Form validation to prevent invalid data from being submitted.
- Graceful handling of API errors.
- Clear and informative error messages to the user.
