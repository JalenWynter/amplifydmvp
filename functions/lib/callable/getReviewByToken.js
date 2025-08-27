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
exports.getReviewByToken = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
exports.getReviewByToken = (0, https_1.onCall)(async (request) => {
    const { reviewId, token } = request.data;
    // Validate required parameters
    if (!reviewId || !token) {
        throw new https_1.HttpsError('invalid-argument', 'Review ID and token are required');
    }
    if (typeof reviewId !== 'string' || typeof token !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Review ID and token must be strings');
    }
    try {
        const reviewDoc = await admin.firestore().collection('reviews').doc(reviewId).get();
        if (!reviewDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Review not found');
        }
        const review = reviewDoc.data();
        if (!review) {
            throw new https_1.HttpsError('not-found', 'Review data not found');
        }
        // Verify access token
        if (review.accessToken !== token) {
            throw new https_1.HttpsError('permission-denied', 'Invalid access token');
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
    }
    catch (error) {
        console.error('Error fetching review by token:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to fetch review');
    }
});
//# sourceMappingURL=getReviewByToken.js.map