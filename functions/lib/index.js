import * as admin from 'firebase-admin';
admin.initializeApp();
export * from './callable';
export * from './callable/submitApplication';
export * from './callable/createReferralCode';
export * from './callable/createPayout';
export * from './callable/updatePayoutStatus';
export * from './callable/rejectApplication';
export { stripeWebhook } from './webhooks/stripe';
//# sourceMappingURL=index.js.map