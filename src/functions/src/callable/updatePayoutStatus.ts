import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const updatePayoutStatus = onCall(async (request) => {
    const { payoutId, status } = request.data;
    // ...rest of your logic
}); 