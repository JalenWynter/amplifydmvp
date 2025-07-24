import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db } from "../utils/firebaseAdmin";
import { SUBMISSION_STATUS } from "../../../lib/constants/statuses";
import type { Review, Submission } from "../../../lib/types";

export const submitReview = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const { uid } = context.auth;
    const { submissionId, reviewData, overallScore } = data;

    if (!submissionId || !reviewData || typeof overallScore !== 'number') {
        throw new functions.https.HttpsError("invalid-argument", "Missing required review data.");
    }

    const submissionRef = db.collection("submissions").doc(submissionId);
    const reviewRef = db.collection("reviews").doc(); // Firestore generates ID

    return db.runTransaction(async (transaction) => {
        const submissionDoc = await transaction.get(submissionRef);

        if (!submissionDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Submission not found.");
        }

        const submission = submissionDoc.data() as Submission;

        // Security: Ensure the authenticated user is the assigned reviewer for this submission
        if (submission.reviewerId !== uid) {
            throw new functions.https.HttpsError("permission-denied", "You are not authorized to review this submission.");
        }

        // Prevent multiple reviews for the same submission
        if (submission.status === SUBMISSION_STATUS.REVIEWED) {
            throw new functions.https.HttpsError("failed-precondition", "This submission has already been reviewed.");
        }

        const newReview: Omit<Review, 'id'> = {
            submissionId: submission.id,
            reviewerId: uid,
            scores: reviewData.scores,
            overallScore: overallScore,
            strengths: reviewData.strengths,
            improvements: reviewData.improvements,
            summary: reviewData.summary,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            submissionDetails: {
                artistName: submission.artistName,
                songTitle: submission.songTitle,
            },
        };

        transaction.set(reviewRef, newReview);
        transaction.update(submissionRef, { status: SUBMISSION_STATUS.REVIEWED, reviewedAt: admin.firestore.FieldValue.serverTimestamp() });

        return { success: true, reviewId: reviewRef.id };
    });
});
