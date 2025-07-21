# Stack Overview

This document provides a high-level overview of the technology stack used in the Amplifyd application.

## Frontend
- **Framework**: Next.js (React)
- **UI Library**: ShadCN UI
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useEffect, useCallback, etc.)

## Backend (Firebase & Next.js API Routes)
- **Database**: Google Firestore
- **Authentication**: Firebase Authentication
- **File Storage**: Firebase Storage
- **Serverless Functions**: Firebase Cloud Functions (Node.js)
- **API Routes**: Next.js API Routes (for Stripe webhooks, etc.)
- **Payments**: Stripe (client-side integration and server-side webhooks)

## AI Integration
- **Framework**: Genkit
- **AI Models**: Google AI (e.g., Gemini)

## Development Tools
- **Package Manager**: npm
- **Language**: TypeScript
- **Local Development**: Firebase Emulator Suite
- **Version Control**: Git / GitHub

## Deployment
- **Hosting**: Firebase Hosting
- **Functions**: Firebase Cloud Functions

This stack is chosen for its scalability, developer efficiency, and robust ecosystem, allowing for rapid development and deployment of a full-stack application.
