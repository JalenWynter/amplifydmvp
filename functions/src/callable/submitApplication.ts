import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

export const submitApplication = onCall(async (request) => {
  const { name, email, primaryRole, portfolioLink, musicBackground, joinReason, referral } = request.data;
  if (!name || !email || !primaryRole || !musicBackground || !joinReason) {
    throw new HttpsError('invalid-argument', 'Missing required application fields.');
  }
  try {
    await admin.firestore().collection('applications').add({
      name: name,
      email: email,
      primaryRole: primaryRole,
      portfolioLink: portfolioLink || '',
      musicBackground: musicBackground,
      joinReason: joinReason,
      referral: referral || '',
      status: 'pending',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, message: 'Application submitted successfully.' };
  } catch (error) {
    console.error('Error submitting application:', error);
    throw new HttpsError('internal', 'Failed to submit application.', error);
  }
});
