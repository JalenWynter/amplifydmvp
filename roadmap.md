# Amplifyd Roadmap

This document outlines the development roadmap for the Amplifyd platform, from the current development phase to the initial production launch and beyond.

## Phase 1: Core Uploader & Reviewer Experience (Completed)

This phase focused on building the essential features for the platform's primary users: musicians (uploaders) and reviewers.

**1.1. Uploader Flow (Anonymous & Email-Tracked)**

*   **[Done]** Create a multi-step submission form for anonymous users.
*   **[Done]** Implement secure file uploads to Firebase Storage using pre-signed URLs.
*   **[Done]** Integrate Stripe for payment processing.
*   **[Done]** Develop a system for anonymous users to track submission status via a unique token and their email.
    *   *Micro-task:* Implement frontend UI for token/email input.
    *   *Micro-task:* Update backend callable function to query by token OR email.
    *   *Micro-task:* Update frontend `getSubmissionStatusByToken` to handle new backend response.
*   **[Done]** Implement email notifications for submission confirmation (triggered after successful payment).
    *   *Micro-task:* Configure `emailService.ts` with Nodemailer and Firebase environment variables.
    *   *Micro-task:* Integrate `sendEmail` into Stripe webhook `onPaymentSucceeded`.

**1.2. Reviewer Flow**

*   **[Done]** Create a public-facing page to display reviewer profiles.
*   **[Done]** Develop a dashboard for reviewers to manage their profiles and review submissions.
*   **[Done]** Implement the review submission process, allowing reviewers to submit their feedback.
*   **[Done]** Implement email notifications for notifying reviewers of new submissions (triggered upon assignment).
    *   *Micro-task:* Integrate `sendEmail` into Stripe webhook `onPaymentSucceeded` to notify assigned reviewer.

**1.3. Admin Panel (Largely Completed)**

*   **[Done]** Create a basic admin panel for user management and reviewer application approval.
    *   *Micro-task:* Implement user role and status management.
*   **[Done]** Add functionality to the admin panel to view and manage all submissions.
    *   *Micro-task:* Implement reviewer assignment and submission status updates.
*   **[Done]** Implement a system for admins to manage payouts to reviewers.
*   **[Done]** Implement a system for admins to manage referral tracking.
*   **[Done]** Implement a system for admins to manage platform settings.
*   **[Done]** Implement real-time API & Server Logging in the admin panel.
    *   *Micro-task:* Create Firebase Callable Function to fetch logs from Google Cloud Logging.
    *   *Micro-task:* Update frontend `getApiLogs` to call the new callable function.

## Phase 2: Enhanced Anonymous Uploader Experience & Feature Expansion (In Progress)

This phase focuses on refining the anonymous uploader experience and expanding platform capabilities.

**2.1. Enhanced Anonymous Uploader Experience**

*   **[To Do]** Explore ways to provide a consolidated view of past submissions for repeat uploaders (identified by email, without requiring login).
    *   *Consideration:* How to securely present multiple submissions without exposing sensitive data.
    *   *Consideration:* UI/UX for selecting a specific submission from a list.
*   **[To Do]** Implement a mechanism for uploaders to update their contact email for a submission (if needed).

**2.2. Feature Expansion**

*   **[To Do]** Implement a rating and review system for reviewers (allowing uploaders to rate the review they received).
    *   *Consideration:* Data model for ratings.
    *   *Consideration:* UI for submitting ratings.
*   **[To Do]** Add support for multiple file uploads (e.g., for albums or EPs).
    *   *Consideration:* Storage implications.
    *   *Consideration:* UI for managing multiple files in a submission.
*   **[To Do]** Explore the possibility of adding a messaging system for communication between uploaders and reviewers.
    *   *Consideration:* Real-time vs. asynchronous messaging.
    *   *Consideration:* Privacy and moderation.

## Phase 3: Deployment & Launch (To Do)

This phase focuses on preparing the platform for production and launching it to the public.

**3.1. Pre-Launch Checklist**

*   **[To Do]** Conduct thorough testing of all features.
*   **[To Do]** Perform a security audit of the platform.
*   **[To Do]** Set up monitoring and alerting for the production environment.
*   **[To Do]** Finalize all legal documents (e.g., terms of service, privacy policy).

**3.2. Deployment**

*   **[To Do]** Create a production build of the application.
*   **[To Do]** Deploy the application to Firebase Hosting.
*   **[To Do]** Configure a custom domain for the application.

**3.3. Launch**

*   **[To Do]** Announce the launch of the platform on social media and other channels.
*   **[To Do]** Monitor the platform for any issues and respond to user feedback.

## Post-Launch (To Do)

*   **[To Do]** Continuously monitor the platform for performance and security.
*   **[To Do]** Gather user feedback and use it to inform future development.
*   **[To Do]** Plan and implement new features based on user feedback and market research.