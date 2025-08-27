import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const approveApplication = onCall(async (request) => {
  // Check if user is admin
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  // Get user role from Firestore
  const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can approve applications.');
  }

  const { applicationId } = request.data;

  if (!applicationId) {
    throw new HttpsError('invalid-argument', 'Application ID is required.');
  }

  try {
    // Get the application
    const applicationRef = admin.firestore().collection('applications').doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      throw new HttpsError('not-found', 'Application not found.');
    }

    const applicationData = applicationDoc.data();
    
    // Update application status
    await applicationRef.update({
      status: 'approved',
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create user account and reviewer profile
    const userId = `reviewer_${applicationId}_${Date.now()}`;
    
    // Create user document
    await admin.firestore().collection('users').doc(userId).set({
      id: userId,
      email: applicationData?.email,
      name: applicationData?.name,
      role: 'reviewer',
      status: 'Active',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
              avatarUrl: '/USETHIS.png',
    });

    // Create reviewer profile
    await admin.firestore().collection('reviewers').doc(userId).set({
      id: userId,
      name: applicationData?.name,
              avatarUrl: '/USETHIS.png',
      dataAiHint: 'professional portrait',
      turnaround: '3-5 days',
      genres: [applicationData?.primaryRole || 'General'],
      experience: applicationData?.musicBackground || '',
      packages: [
        {
          id: `pkg_${userId}_01`,
          name: 'Standard Review',
          priceInCents: 2500,
          description: 'Detailed feedback on your track.',
          trackCount: 1,
          formats: ['written', 'chart']
        }
      ],
    });

    return { success: true, message: 'Application approved and reviewer account created successfully.' };
  } catch (error) {
    console.error('Error approving application:', error);
    throw new HttpsError('internal', 'Failed to approve application.');
  }
});
