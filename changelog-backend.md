# Amplifyd Backend Changelog

## v1.1.0 - 2024-07-15

### Added
- Implemented `/api/webhooks/stripe` for handling payment events.
- Added server-side validation for reviewer applications.
- Introduced referral code generation logic in the admin panel.

### Fixed
- Optimized Firestore queries for fetching submissions in the reviewer dashboard.
- Corrected an issue with user role assignment upon application approval.

## v1.0.0 - 2024-06-01

### Added
- Initial release of the Amplifyd backend.
- Firebase Authentication setup for email/password and Google.
- Secure file upload logic using Firebase Storage signed URLs.
- Firestore data models for Users, Submissions, and Reviews.
- Basic API for user and submission management.
