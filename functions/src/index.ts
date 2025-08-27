import * as admin from 'firebase-admin';
admin.initializeApp();

// export * from './callable';
export * from './callable/submitApplication';
export * from './callable/createReferralCode';
export * from './callable/createPayout';
export * from './callable/updatePayoutStatus';
export * from './callable/rejectApplication';
export * from './callable/approveApplication';
export * from './callable/getSubmissionsForReviewer';
export * from './callable/submitReview';
export * from './callable/getAllReviews';
export * from './callable/getReviewByToken';
export * from './callable/updateReviewerEarnings';
export * from './callable/getSignedUploadUrl';
export * from './callable/createSubmission';
export * from './callable/getAdminDashboardStats';
export { stripeWebhook } from './webhooks/stripe';