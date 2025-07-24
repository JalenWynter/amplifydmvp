import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const rejectApplication = functions.https.onCall(async (data: { applicationId: string; }, context: functions.https.CallableContext) => {
  if (!context.auth || (await admin.auth().getUser(context.auth.uid)).customClaims?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can reject applications.');
  }

  const { applicationId } = data;

  if (!applicationId) {
    throw new functions.https.HttpsError('invalid-argument', 'Application ID is required.');
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
    throw new functions.https.HttpsError('internal', 'Failed to reject application.', error);
  }
});
