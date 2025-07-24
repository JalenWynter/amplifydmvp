## Amplifyd Project Definition - update5.md

This document outlines the architecture for the **Admin** role, defining their responsibilities, user flow, and the necessary backend services.

### 1. Core Responsibilities & User Stories

The Admin role is responsible for the overall management and health of the platform.

- **As an Admin, I want to review and approve or reject applications from users who want to become reviewers.**
- **As an Admin, I want to manage user roles, with the ability to manually assign or revoke `reviewer` or `admin` status.**
- **As an Admin, I want to have a dashboard to view all music submissions and their current status (pending, in-progress, completed).**
- **As an Admin, I want to receive a clear notification when a review is completed, so I know a manual payout is due to the reviewer.**
- **As an Admin, I want to track payouts and mark them as 'Paid' to keep financial records organized.**
- **As an Admin, I want to view basic platform analytics, such as the number of users, submissions, and total revenue.**

### 2. UI/UX Flow

The Admin's entire experience will be contained within a dedicated, secure Admin Dashboard accessible from a route like `/admin`.

1.  **Login**: The Admin logs in with their credentials.
2.  **Dashboard**: The main dashboard presents an overview of key metrics and notifications.
3.  **User Management**: A section with a table of all users. The Admin can filter users and use a simple interface (e.g., a dropdown menu on each user row) to change a user's role.
4.  **Application Review**: A dedicated section lists all pending reviewer applications. The Admin can view application details and click 'Approve' or 'Reject'.
5.  **Payouts Queue**: A list of all completed reviews that are pending payment. Each item shows the reviewer's name, the amount due, and the reviewer's `manualPaymentInfoString`. The Admin can click a 'Mark as Paid' button for each item.

### 3. Data Models & Access Control

The Admin role does not require new data models but needs privileged read/write access to existing collections via Firestore Security Rules, enforced on the server-side in Firebase Functions.

- **`users`**: Full read/write access.
- **`reviewers`**: Full read/write access.
- **`submissions`**: Full read access.
- **`reviews`**: Full read access.

### 4. Functions & Services (Backend Logic)

These operations will be implemented as secure, callable Firebase Functions, ensuring that only authenticated admins can execute them.

- **`assignReviewerRole(data: {userId: string})`**: A callable function that takes a `userId`, verifies the caller is an admin, and then uses the Firebase Admin SDK to set a custom claim (`{role: 'reviewer'}`) for the target user. It also creates the corresponding document in the `reviewers` collection.
- **`getPendingApplications()`**: A callable function that retrieves all user documents with a status of `pending_reviewer_application`.
- **`listUsers()`**: A callable function that returns a list of all users on the platform.
- **`updatePayoutStatus(data: {reviewId: string, status: 'paid'})`**: A callable function that updates a review or submission document to reflect that a payout has been completed. This will also update the reviewer's `totalPaidString`.
