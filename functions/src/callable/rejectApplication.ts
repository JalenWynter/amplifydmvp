import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const rejectApplication = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  // Get user role from Firestore
  const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can reject applications.');
  }

  const { applicationId } = request.data;

  if (!applicationId) {
    throw new HttpsError('invalid-argument', 'Application ID is required.');
  }

  try {
    const applicationRef = admin.firestore().collection('applications').doc(applicationId);
    await applicationRef.update({
      status: 'rejected',
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Optionally, send an email notification to the applicant

    return { success: true, message: 'Application rejected successfully.' };
  } catch (error) {
    console.error('Error rejecting application:', error);
    throw new HttpsError('internal', 'Failed to reject application.');
  }
});
