import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const createReferralCode = onCall(async (request) => {
    const { associatedUser, referrerId } = request.data;
    // ...rest of your logic
}); 