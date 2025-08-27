import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const getAllReviews = onCall(async (request) => {
  const { limit = 50, offset = 0 } = request.data || {};

  // Validate parameters
  if (typeof limit !== 'number' || limit < 1 || limit > 100) {
    throw new HttpsError('invalid-argument', 'Limit must be between 1 and 100');
  }

  if (typeof offset !== 'number' || offset < 0) {
    throw new HttpsError('invalid-argument', 'Offset must be non-negative');
  }

  try {
    const reviewsRef = admin.firestore().collection('reviews');
    
    // Get reviews with pagination
    let query = reviewsRef
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (offset > 0) {
      // For offset pagination, we need to get the document at offset position
      const offsetQuery = reviewsRef
        .orderBy('createdAt', 'desc')
        .limit(offset);
      
      const offsetSnapshot = await offsetQuery.get();
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();

    const reviews = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          overallScore: data.overallScore,
          submissionDetails: data.submissionDetails,
          createdAt: data.createdAt,
          reviewerId: data.reviewerId,
          summary: data.summary,
          strengths: data.strengths,
          improvements: data.improvements,
          // Don't include sensitive data like accessToken, detailed scores, etc.
        };
      })
      .filter(review => {
        // Only return completed reviews that have all required fields
        return review.overallScore && 
               review.summary && 
               review.strengths && 
               review.improvements &&
               review.submissionDetails &&
               review.submissionDetails.artistName &&
               review.submissionDetails.songTitle;
      });

    // Get total count for pagination info
    const totalSnapshot = await reviewsRef.count().get();
    const totalCount = totalSnapshot.data().count;

    console.log(`Retrieved ${reviews.length} reviews (limit: ${limit}, offset: ${offset})`);

    return { 
      reviews,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + reviews.length < totalCount
      }
    };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to fetch reviews');
  }
});
