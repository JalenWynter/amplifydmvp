import * as admin from "firebase-admin";

admin.initializeApp();

// Temporarily commenting out problematic functions to deploy getSignedUploadUrl
// export { approveApplication } from "./src/callable/users";
// export { createUserDocument } from "./src/users"; // This is an event-triggered function
// export { updateReviewerProfile, addPackage, updatePackage, deletePackage, updateReviewerPaidStatus } from "./src/callable/reviewers";
export { getSignedUploadUrl } from "./src/callable/getSignedUploadUrl";
// export { createPaymentIntent } from "./src/callable/createPaymentIntent";
// export { submitReview } from "./src/callable/submitReview";
// export { getSubmissionStatusByToken } from "./src/callable/getSubmissionStatusByToken";
// export { onPaymentSucceeded } from "./src/webhooks/stripe";
// export { updateUserRole, updateUserStatus } from "./src/callable/admin/users";
// export { getApiLogsCallable } from './src/callable/getApiLogs';
