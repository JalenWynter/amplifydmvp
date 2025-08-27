import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const createPayout = onCall(async (request) => {
    const { reviewerId, reviewer, amount, amountInCents, paymentMethod, reviews } = request.data;
    // ...rest of your logic
}); 