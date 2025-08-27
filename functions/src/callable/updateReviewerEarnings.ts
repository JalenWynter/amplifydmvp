import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const updateReviewerEarnings = onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to update earnings');
  }

  const { reviewerId, amount, reviewId, type = 'review_completion' } = request.data;
  const adminId = request.auth.uid;

  // Validate required parameters
  if (!reviewerId || !amount || !reviewId) {
    throw new HttpsError('invalid-argument', 'Reviewer ID, amount, and review ID are required');
  }

  if (typeof amount !== 'number' || amount <= 0) {
    throw new HttpsError('invalid-argument', 'Amount must be a positive number');
  }

  try {
    // Verify user is an admin
    const adminDoc = await admin.firestore().collection('users').doc(adminId).get();
    if (!adminDoc.exists) {
      throw new HttpsError('permission-denied', 'User not found');
    }

    const adminData = adminDoc.data();
    if (adminData?.role !== 'Admin') {
      throw new HttpsError('permission-denied', 'Only admins can update earnings');
    }

    // Verify reviewer exists
    const reviewerDoc = await admin.firestore().collection('reviewers').doc(reviewerId).get();
    if (!reviewerDoc.exists) {
      throw new HttpsError('not-found', 'Reviewer not found');
    }

    // Verify review exists and is completed
    const reviewDoc = await admin.firestore().collection('reviews').doc(reviewId).get();
    if (!reviewDoc.exists) {
      throw new HttpsError('not-found', 'Review not found');
    }

    const reviewData = reviewDoc.data();
    if (!reviewData) {
      throw new HttpsError('not-found', 'Review data not found');
    }

    if (reviewData.reviewerId !== reviewerId) {
      throw new HttpsError('permission-denied', 'Review does not belong to this reviewer');
    }

    // Check if earnings already recorded for this review
    const existingEarningsQuery = await admin.firestore()
      .collection('earnings')
      .where('reviewId', '==', reviewId)
      .limit(1)
      .get();

    if (!existingEarningsQuery.empty) {
      throw new HttpsError('already-exists', 'Earnings already recorded for this review');
    }

    // Update reviewer earnings
    await admin.firestore().collection('reviewers').doc(reviewerId).update({
      totalEarned: admin.firestore.FieldValue.increment(amount),
      lastEarningUpdate: admin.firestore.FieldValue.serverTimestamp(),
      totalReviews: admin.firestore.FieldValue.increment(1)
    });

    // Create earnings record
    const earningsData = {
      reviewerId,
      reviewId,
      amount,
      type,
      createdBy: adminId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const earningsRef = await admin.firestore().collection('earnings').add(earningsData);

    console.log(`Earnings updated for reviewer ${reviewerId}: $${amount} for review ${reviewId}`);

    return { 
      success: true,
      earningsId: earningsRef.id,
      amount,
      reviewerId,
      reviewId
    };
  } catch (error) {
    console.error('Error updating reviewer earnings:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to update earnings');
  }
});
