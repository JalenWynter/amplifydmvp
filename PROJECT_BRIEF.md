# Amplifyd: Project Brief & Architecture

## 1. Application Goal

Amplifyd is a two-sided marketplace designed to bridge the gap between emerging music artists and established industry professionals. It provides a structured, transparent, and reliable platform for artists to receive high-quality, paid feedback on their music from verified reviewers.

- **For Artists**: It solves the problem of sending demos into a void, offering guaranteed, detailed feedback to help them improve their craft.
- **For Reviewers**: It provides a flexible way to monetize their expertise, discover new talent, and manage a professional feedback service.
- **For Admins**: It offers a centralized dashboard to manage the platform's quality, users, and finances.

## 2. Core Features

- **Anonymous Artist Submissions**: Artists can submit tracks for review without needing to create an account, ensuring a low-friction process. Payment is handled securely via Stripe.
- **Reviewer Application System**: Industry professionals can apply to become reviewers. Applications are manually vetted by admins to maintain a high standard of quality.
- **Configurable Application Mode**: Admins can toggle the platform between requiring a valid invite code for new applications (for controlled growth) and allowing open applications for everyone.
- **Public Reviewer Profiles**: Verified reviewers have public profiles showcasing their experience, genre specializations, and service packages.
- **Comprehensive Review System**: Reviewers use a detailed 16-point scoring chart and provide written feedback, ensuring artists receive structured and actionable advice.
- **Role-Based Dashboards**:
    - **Reviewer Dashboard**: For managing their public profile, review packages, and completing assigned submissions.
    - **Admin Dashboard**: For overseeing all platform activity, managing user accounts, approving applications, handling finances, and generating referral codes.
- **Secure Payments & File Storage**: Utilizes Stripe for all payment processing and Firebase Storage for secure handling of music files.

## 3. Technical Architecture

Amplifyd is built on a modern, serverless stack designed for scalability, security, and a rich user experience.

- **Framework**: **Next.js** (App Router) for a hybrid of Server-Side Rendering (SSR) and Client-Side Rendering (CSR).
- **UI**: **React** with **TypeScript**, styled using **Tailwind CSS** and **ShadCN UI** components for a professional and consistent design system.
- **Backend & Database**: **Google Firebase**
    - **Firestore**: A NoSQL database for storing all application data (users, submissions, reviews, etc.).
    - **Firebase Authentication**: Manages user sign-up, login, and session management for reviewers and admins.
    - **Firebase Storage**: For secure uploads and storage of artist music files.
    - **Firestore Security Rules**: The primary mechanism for enforcing data access control and protecting user data.
- **Payments**: **Stripe** for processing payments and managing checkout sessions. Secure webhook integration confirms successful payments.
- **AI (Future-Ready)**: **Google AI & Genkit** are set up and ready for future integration to provide AI-powered features like feedback summaries or genre analysis.

## 4. Key Design Principles

- **Security First**: All operations are governed by strict Firestore Security Rules. Sensitive actions are handled server-side.
- **Role-Based Access Control (RBAC)**: The UI and data access are strictly controlled based on user roles (Artist, Reviewer, Admin).
- **Production-Ready UI**: The interface uses loading skeletons, toast notifications, and consistent design patterns to provide a smooth and professional user experience.
- **Scalable & Maintainable**: The codebase is organized by feature and leverages reusable components and services. The documentation is structured to support future development and onboarding.
