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
exports.submitReview = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const emailService_1 = require("../utils/emailService");
exports.submitReview = (0, https_1.onCall)(async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated to submit reviews');
    }
    const { submissionId, scores, overallScore, strengths, improvements, summary } = request.data;
    const reviewerId = request.auth.uid;
    // Validate required fields
    if (!submissionId || !scores || !overallScore || !strengths || !improvements || !summary) {
        throw new https_1.HttpsError('invalid-argument', 'All review fields are required');
    }
    // Validate overall score
    if (typeof overallScore !== 'number' || overallScore < 0 || overallScore > 10) {
        throw new https_1.HttpsError('invalid-argument', 'Overall score must be between 0 and 10');
    }
    try {
        // Verify user is a reviewer
        const userDoc = await admin.firestore().collection('users').doc(reviewerId).get();
        if (!userDoc.exists) {
            throw new https_1.HttpsError('permission-denied', 'User not found');
        }
        const userData = userDoc.data();
        if ((userData === null || userData === void 0 ? void 0 : userData.role) !== 'Reviewer' && (userData === null || userData === void 0 ? void 0 : userData.role) !== 'Admin') {
            throw new https_1.HttpsError('permission-denied', 'Only reviewers can submit reviews');
        }
        // Get submission details
        const submissionDoc = await admin.firestore().collection('submissions').doc(submissionId).get();
        if (!submissionDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Submission not found');
        }
        const submission = submissionDoc.data();
        if (!submission) {
            throw new https_1.HttpsError('not-found', 'Submission data not found');
        }
        if (submission.reviewerId !== reviewerId) {
            throw new https_1.HttpsError('permission-denied', 'Not authorized to review this submission');
        }
        if (submission.status !== 'Pending Review') {
            throw new https_1.HttpsError('failed-precondition', 'Submission is not in pending review status');
        }
        // Check if review already exists
        const existingReviewQuery = await admin.firestore()
            .collection('reviews')
            .where('submissionId', '==', submissionId)
            .where('reviewerId', '==', reviewerId)
            .limit(1)
            .get();
        if (!existingReviewQuery.empty) {
            throw new https_1.HttpsError('already-exists', 'Review already exists for this submission');
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
        const accessToken = (0, emailService_1.generateSecureToken)();
        await admin.firestore().collection('reviews').doc(reviewRef.id).update({
            accessToken
        });
        // Send notification to artist (email)
        await (0, emailService_1.sendReviewCompleteEmail)(submission.contactEmail, submission.artistName, reviewRef.id, accessToken);
        console.log(`Review submitted successfully for submission ${submissionId} by reviewer ${reviewerId}`);
        return {
            success: true,
            reviewId: reviewRef.id,
            reviewUrl: `/review/${reviewRef.id}?token=${accessToken}`
        };
    }
    catch (error) {
        console.error('Error submitting review:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to submit review');
    }
});
//# sourceMappingURL=submitReview.js.map