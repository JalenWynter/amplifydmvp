import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

export const submitApplication = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const { name, email, userId } = request.data;
  if (!name || !email || !userId) {
    throw new HttpsError('invalid-argument', 'Missing required application fields.');
  }
  try {
    await admin.firestore().collection('applications').add({
      userId: userId,
      name: name,
      email: email,
      status: 'pending',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, message: 'Application submitted successfully.' };
  } catch (error) {
    console.error('Error submitting application:', error);
    throw new HttpsError('internal', 'Failed to submit application.', error);
  }
});
