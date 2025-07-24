## Amplifyd Project Definition - update6.md

This document outlines the architecture for the **Uploader (Musician)** role, defining their user flow, and the necessary backend services. This role is central to the platform's core function.

### 1. Core Concept & User Stories

The Uploader is the primary customer of the platform. The goal is to make their experience as seamless and trustworthy as possible, whether they are a registered user or a one-time anonymous user.

- **As an Uploader, I want to easily browse and discover reviewers on the platform to find the right fit for my music.**
- **As an Uploader, I want a simple, single-page form to submit my music track, artist information, and select a reviewer.**
- **As an Uploader, I want to pay for the review securely using Stripe.**
- **As an Uploader, I want to submit my music without needing to create an account (anonymously).**
- **As an Uploader, I want to receive an email confirmation with a unique link or token to track the status of my submission.**
- **As an Uploader, I want to view the completed review from the reviewer.**
- **(If Registered) As an Uploader, I want a dashboard to see a history of all my past submissions and their corresponding reviews.**

### 2. UI/UX Flow

1.  **Homepage/Discover Reviewers**: The main landing page will feature a grid or list of reviewer profiles (`ReviewerCard` components). Users can click on a reviewer to see their detailed '1-Pager' profile.
2.  **Submission Form**: This will be a primary call-to-action on the homepage. It will be a multi-step form (`src/components/submission/submission-form.tsx`) that guides the user through:
    a.  Uploading their audio file.
    b.  Entering their artist name, song title, and email address.
    c.  Selecting a reviewer.
    d.  Proceeding to payment.
3.  **Payment**: The user is redirected to a Stripe Checkout page to complete the payment.
4.  **Confirmation**: After successful payment, the user is shown a success page. An email is sent to them with their `trackingToken`.
5.  **Status Tracking**: The user can use their token on a dedicated tracking page (`/review/[trackingToken]`) to see the current status (`pending`, `in-progress`, `completed`).
6.  **View Review**: Once completed, the tracking page will display the full review details.

### 3. Functions & Services (Backend Logic)

These operations will be implemented as secure, callable Firebase Functions.

- **`getSignedUploadUrl(data: {fileName: string, contentType: string})`**: A callable function that generates a pre-signed URL for Firebase Storage. The frontend will use this URL to upload the audio file directly and securely to the storage bucket, preventing the need for the file to pass through the server.
- **`createPaymentIntent(data: {reviewerId: string, amount: number})`**: A callable function that creates a Stripe Payment Intent. It returns a `client_secret` that the frontend uses to initialize the Stripe payment flow.
- **`onPaymentSucceeded(event: Stripe.Event)`**: A Stripe webhook handler (Firebase Function). This is the most critical function:
    a.  It verifies the webhook signature to ensure the request is from Stripe.
    b.  It creates a new document in the `submissions` collection with the submission details.
    c.  It generates a unique `trackingToken`.
    d.  It triggers an email to the uploader with the tracking link.
- **`getSubmissionStatusByToken(data: {trackingToken: string})`**: A callable function that allows an anonymous user to retrieve the status and (if completed) the content of their review using their unique token.
