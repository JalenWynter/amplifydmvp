# Backend Changelog

## [2025-01-16] - Constants Implementation
- Created `src/lib/constants/statuses.ts` with all application-wide status constants
- Created `src/lib/types/index.ts` to centralize all TypeScript interfaces
- Updated `services.ts` to use constants instead of hardcoded strings:
  - Replaced all hardcoded role values (Admin, Reviewer, Artist) with `USER_ROLE` constants
  - Replaced all hardcoded status values with appropriate constants:
    - User status: `USER_STATUS` (Active, Suspended, Banned)
    - Application status: `APPLICATION_STATUS` (Pending Review, Approved, Rejected, Needs More Info)
    - Submission status: `SUBMISSION_STATUS` (Pending Review, In Progress, Reviewed)
    - Referral code status: `REFERRAL_CODE_STATUS` (Active, Used, Expired)
    - Payout status: `PAYOUT_STATUS` (Pending, In-Transit, Paid)
    - Transaction status: `TRANSACTION_STATUS` (pending, completed, failed, cancelled)
    - Application mode: `APPLICATION_MODE` (invite-only, open)
- Moved all interfaces from `services.ts` to `src/lib/types/index.ts` for better organization
- Updated function signatures to use proper TypeScript types
- All existing functionality preserved while improving type safety and maintainability

## v1.1.1 - 2024-12-19

### Fixed
- Fixed null safety error in admin referrals page when accessing user.referredBy property
- Fixed null safety error in dashboard referrals page when accessing referralHistory properties
- Fixed remaining unsafe property accesses in dashboard referrals page (referredBy, referralCode, joinedAt)
- Replaced mock earnings calculation with real Firebase data in getReviewerEarnings function
- Fixed hasReviewerSubmittedReview function parameter order
- Removed mock/placeholder data throughout the application
- Fixed email placeholder in payout creation form to generate from reviewer name
- Fixed profile page to handle non-reviewer users and provide appropriate error messages
- Added role-based access control to dashboard layout to prevent non-reviewers from accessing reviewer-only areas

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
