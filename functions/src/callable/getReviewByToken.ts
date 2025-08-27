import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const getReviewByToken = onCall(async (request) => {
  const { reviewId, token } = request.data;

  // Validate required parameters
  if (!reviewId || !token) {
    throw new HttpsError('invalid-argument', 'Review ID and token are required');
  }

  if (typeof reviewId !== 'string' || typeof token !== 'string') {
    throw new HttpsError('invalid-argument', 'Review ID and token must be strings');
  }

  try {
    const reviewDoc = await admin.firestore().collection('reviews').doc(reviewId).get();
    if (!reviewDoc.exists) {
      throw new HttpsError('not-found', 'Review not found');
    }

    const review = reviewDoc.data();
    if (!review) {
      throw new HttpsError('not-found', 'Review data not found');
    }
    
    // Verify access token
    if (review.accessToken !== token) {
      throw new HttpsError('permission-denied', 'Invalid access token');
    }

    // Return review data without sensitive information
    const publicReviewData = {
      id: reviewId,
      overallScore: review.overallScore,
      scores: review.scores,
      strengths: review.strengths,
      improvements: review.improvements,
      summary: review.summary,
      createdAt: review.createdAt,
      submissionDetails: review.submissionDetails,
      // Don't include reviewerId, accessToken, or other sensitive data
    };

    console.log(`Review ${reviewId} accessed successfully with token`);

    return { review: publicReviewData };
  } catch (error) {
    console.error('Error fetching review by token:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to fetch review');
  }
});
