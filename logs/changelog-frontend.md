# Frontend Changelog

## Recent Changes

### Authentication & Access Control
- Fixed authentication logic across all dashboard pages to use consistent `useAuth()` from AuthContext
- Updated `/dashboard/submissions`, `/dashboard/reviews`, and `/dashboard/referrals` pages to use the same authentication pattern as the working reviewer dashboard
- Added proper role checking (`currentUser.role !== 'reviewer'`) to prevent unauthorized access
- Standardized loading states and access denied messages across all dashboard pages
- Fixed broken links in submissions and reviews pages to point to correct reviewer routes

### Reviewer Dashboard Improvements
- Improved reviewer submission page layout with better responsive design, organized scoring sections, and added audio/video feedback upload functionality.
- Enhanced scoring chart component with better spacing, card-based layout, and improved slider visibility for the 16 feature scoring criteria. 

### File Upload & Storage
- Updated anonymous music upload logic in src/lib/firebase/submissions.ts to use signed URLs and upload to /music-uploads/temp/ instead of /submissions/anonymous/ for security and compliance with storage rules.

### UI/UX Improvements
- Removed broken changelog.md link from footer to prevent 404 errors
- Enhanced scoring chart component with better spacing and visual organization
- Improved reviewer submission page with better layout and multimedia feedback options 