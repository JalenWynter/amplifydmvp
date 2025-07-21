# Amplifyd - Music Review Platform

Amplifyd is a Next.js application built with Firebase Studio, designed to connect music artists with industry professionals for detailed, paid feedback.

This `README.md` serves as the central entry point to the project's documentation.

## Current Development Status

As of the latest development, the Firebase Emulator Suite is fully configured and integrated with the Next.js application. This includes:

-   **Firestore Emulator Persistence:** Data written to the Firestore emulator now persists across emulator restarts.
-   **Client-Side Emulator Connection:** The Next.js application correctly connects to the Auth, Firestore, and Storage emulators for local development.
-   **Firebase Security Rules:** Firestore rules (`firestore.rules.production`) have been updated to allow authenticated users to create their own user and reviewer profiles.
-   **Data Seeding:** A `scripts/seedFirestore.js` script is available to populate all necessary Firestore collections with sample data for comprehensive testing of roles, permissions, and site functionality.
-   **Auth Emulator Seeding:** Users can be created directly in the Firebase Auth Emulator UI or via the `scripts/seedAuthUsers.js` script to enable full authentication testing.

This setup ensures a robust and isolated local development environment for all features.

## Core Documentation

- **[Project Brief](./PROJECT_BRIEF.md)**: A high-level overview of the application's purpose, features, and target audience. Start here to understand the "what" and "why".

- **[Getting Started & Deployment Guide](./GETTING_STARTED_GUIDE.md)**: Your primary guide for setting up the project locally, testing with the Stripe CLI, and deploying the application to Firebase Hosting.

- **[Changelog](./changelog.md)**: A complete, version-controlled history of all major changes made to the application.

- **[Email Setup](./EMAIL_SETUP.md)**: A guide to the transactional emails the application is designed to send.