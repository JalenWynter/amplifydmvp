"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllReviews = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
exports.getAllReviews = (0, https_1.onCall)(async (request) => {
    const { limit = 50, offset = 0 } = request.data || {};
    // Validate parameters
    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        throw new https_1.HttpsError('invalid-argument', 'Limit must be between 1 and 100');
    }
    if (typeof offset !== 'number' || offset < 0) {
        throw new https_1.HttpsError('invalid-argument', 'Offset must be non-negative');
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
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to fetch reviews');
    }
});
//# sourceMappingURL=getAllReviews.js.map