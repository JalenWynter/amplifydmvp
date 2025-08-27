import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const rejectApplication = onCall(async (request) => {
    const { applicationId } = request.data;
    // ...rest of your logic
}); 