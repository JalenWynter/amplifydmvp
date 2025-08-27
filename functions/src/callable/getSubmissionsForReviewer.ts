import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const getSubmissionsForReviewer = onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to access submissions');
  }

  const reviewerId = request.auth.uid;
  
  try {
    // Verify user is a reviewer
    const userDoc = await admin.firestore().collection('users').doc(reviewerId).get();
    if (!userDoc.exists) {
      throw new HttpsError('permission-denied', 'User not found');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'Reviewer' && userData?.role !== 'Admin') {
      throw new HttpsError('permission-denied', 'Only reviewers can access submissions');
    }

    // Get submissions assigned to this reviewer
    const submissionsRef = admin.firestore().collection('submissions');
    const snapshot = await submissionsRef
      .where('reviewerId', '==', reviewerId)
      .where('status', '==', 'Pending Review')
      .orderBy('submittedAt', 'desc')
      .get();

    const submissions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        artistName: data.artistName,
        songTitle: data.songTitle,
        genre: data.genre,
        audioUrl: data.audioUrl,
        submittedAt: data.submittedAt,
        status: data.status,
        contactEmail: data.contactEmail,
        packageId: data.packageId
      };
    });

    console.log(`Retrieved ${submissions.length} pending submissions for reviewer ${reviewerId}`);
    return { submissions };
  } catch (error) {
    console.error('Error fetching submissions for reviewer:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to fetch submissions');
  }
});
