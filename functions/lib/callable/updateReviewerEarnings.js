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
exports.updateReviewerEarnings = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
exports.updateReviewerEarnings = (0, https_1.onCall)(async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated to update earnings');
    }
    const { reviewerId, amount, reviewId, type = 'review_completion' } = request.data;
    const adminId = request.auth.uid;
    // Validate required parameters
    if (!reviewerId || !amount || !reviewId) {
        throw new https_1.HttpsError('invalid-argument', 'Reviewer ID, amount, and review ID are required');
    }
    if (typeof amount !== 'number' || amount <= 0) {
        throw new https_1.HttpsError('invalid-argument', 'Amount must be a positive number');
    }
    try {
        // Verify user is an admin
        const adminDoc = await admin.firestore().collection('users').doc(adminId).get();
        if (!adminDoc.exists) {
            throw new https_1.HttpsError('permission-denied', 'User not found');
        }
        const adminData = adminDoc.data();
        if ((adminData === null || adminData === void 0 ? void 0 : adminData.role) !== 'Admin') {
            throw new https_1.HttpsError('permission-denied', 'Only admins can update earnings');
        }
        // Verify reviewer exists
        const reviewerDoc = await admin.firestore().collection('reviewers').doc(reviewerId).get();
        if (!reviewerDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Reviewer not found');
        }
        // Verify review exists and is completed
        const reviewDoc = await admin.firestore().collection('reviews').doc(reviewId).get();
        if (!reviewDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Review not found');
        }
        const reviewData = reviewDoc.data();
        if (!reviewData) {
            throw new https_1.HttpsError('not-found', 'Review data not found');
        }
        if (reviewData.reviewerId !== reviewerId) {
            throw new https_1.HttpsError('permission-denied', 'Review does not belong to this reviewer');
        }
        // Check if earnings already recorded for this review
        const existingEarningsQuery = await admin.firestore()
            .collection('earnings')
            .where('reviewId', '==', reviewId)
            .limit(1)
            .get();
        if (!existingEarningsQuery.empty) {
            throw new https_1.HttpsError('already-exists', 'Earnings already recorded for this review');
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
    }
    catch (error) {
        console.error('Error updating reviewer earnings:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to update earnings');
    }
});
//# sourceMappingURL=updateReviewerEarnings.js.map