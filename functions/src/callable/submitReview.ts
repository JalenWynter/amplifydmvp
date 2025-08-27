import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateSecureToken, sendReviewCompleteEmail } from '../utils/emailService';

export const submitReview = onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to submit reviews');
  }

  const { submissionId, scores, overallScore, strengths, improvements, summary } = request.data;
  const reviewerId = request.auth.uid;

  // Validate required fields
  if (!submissionId || !scores || !overallScore || !strengths || !improvements || !summary) {
    throw new HttpsError('invalid-argument', 'All review fields are required');
  }

  // Validate overall score
  if (typeof overallScore !== 'number' || overallScore < 0 || overallScore > 10) {
    throw new HttpsError('invalid-argument', 'Overall score must be between 0 and 10');
  }

  try {
    // Verify user is a reviewer
    const userDoc = await admin.firestore().collection('users').doc(reviewerId).get();
    if (!userDoc.exists) {
      throw new HttpsError('permission-denied', 'User not found');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'Reviewer' && userData?.role !== 'Admin') {
      throw new HttpsError('permission-denied', 'Only reviewers can submit reviews');
    }

    // Get submission details
    const submissionDoc = await admin.firestore().collection('submissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      throw new HttpsError('not-found', 'Submission not found');
    }

    const submission = submissionDoc.data();
    if (!submission) {
      throw new HttpsError('not-found', 'Submission data not found');
    }

    if (submission.reviewerId !== reviewerId) {
      throw new HttpsError('permission-denied', 'Not authorized to review this submission');
    }

    if (submission.status !== 'Pending Review') {
      throw new HttpsError('failed-precondition', 'Submission is not in pending review status');
    }

    // Check if review already exists
    const existingReviewQuery = await admin.firestore()
      .collection('reviews')
      .where('submissionId', '==', submissionId)
      .where('reviewerId', '==', reviewerId)
      .limit(1)
      .get();

    if (!existingReviewQuery.empty) {
      throw new HttpsError('already-exists', 'Review already exists for this submission');
    }

    // Create review
    const reviewData = {
      submissionId,
      reviewerId,
      scores,
      overallScore,
      strengths,
      improvements,
      summary,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      submissionDetails: {
        artistName: submission.artistName,
        songTitle: submission.songTitle,
        genre: submission.genre
      }
    };

    const reviewRef = await admin.firestore().collection('reviews').add(reviewData);
    
    // Update submission status
    await admin.firestore().collection('submissions').doc(submissionId).update({
      status: 'Completed',
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewId: reviewRef.id
    });

    // Generate secure access token
    const accessToken = generateSecureToken();
    await admin.firestore().collection('reviews').doc(reviewRef.id).update({
      accessToken
    });

    // Send notification to artist (email)
    await sendReviewCompleteEmail(submission.contactEmail, submission.artistName, reviewRef.id, accessToken);

    console.log(`Review submitted successfully for submission ${submissionId} by reviewer ${reviewerId}`);

    return { 
      success: true, 
      reviewId: reviewRef.id,
      reviewUrl: `/review/${reviewRef.id}?token=${accessToken}`
    };
  } catch (error) {
    console.error('Error submitting review:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to submit review');
  }
});
