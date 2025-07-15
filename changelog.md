# Amplifyd Changelog

This document tracks all major changes to the Amplifyd application, covering both frontend and backend updates.

## v1.2.0 - 2024-07-29

### Added
- **Admin Dashboard Overhaul**: Replaced static placeholders on the main admin overview page with dynamic charts for User Growth and Submission Trends.
- **Dynamic Application Form**: Reviewer application submissions now dynamically update the application list in the admin panel, simulating a real-time backend.
- **Production-Ready UI**: Polished various UI components and interactions to feel more like a production application.
- **Unified Changelog**: Combined frontend and backend changelogs into a single, user-facing document.

## v1.1.0 - 2024-07-20

### Added
- Implemented confetti effect on the submission success page.
- Added skeleton loaders to the reviewers list page for improved perceived performance.
- Introduced toast notifications for form submissions and errors.
- Implemented `/api/webhooks/stripe` for handling payment events.
- Added server-side validation for reviewer applications.
- Introduced referral code generation logic in the admin panel.

### Changed
- Redesigned the reviewer profile page for better information hierarchy.
- Updated the 16-point scoring chart with improved slider controls.

### Fixed
- Resolved a layout shift issue in the main header on mobile devices.
- Fixed a bug where the file input would not clear after form submission.
- Optimized Firestore queries for fetching submissions in the reviewer dashboard.
- Corrected an issue with user role assignment upon application approval.


## v1.0.0 - 2024-06-01

### Added
- Initial release of the Amplifyd frontend and backend.
- Artist music submission form.
- Reviewer application and login forms.
- Reviewer and Admin dashboard layouts.
- Public-facing page for listing all reviewers.
- Firebase Authentication setup for email/password and Google.
- Secure file upload logic using Firebase Storage signed URLs.
- Firestore data models for Users, Submissions, and Reviews.
- Basic API for user and submission management.
