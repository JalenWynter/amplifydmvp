import * as functions from "firebase-functions";
import { db } from "../utils/firebaseAdmin";
import type { Submission, Review } from "../../../lib/types";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";

export const getSubmissionStatusByToken = functions.https.onCall(async (data, context) => {
    const { trackingToken, uploaderEmail } = data;

    if (!trackingToken && !uploaderEmail) {
        throw new functions.https.HttpsError("invalid-argument", "Either a tracking token or an uploader email is required.");
    }

    try {
        const submissionsRef = collection(db, "submissions");
        let q;
        let submissions: Submission[] = [];

        if (trackingToken) {
            // Prioritize tracking token for a single, specific submission
            q = query(submissionsRef, where("trackingToken", "==", trackingToken));
            if (uploaderEmail) {
                q = query(q, where("uploaderEmail", "==", uploaderEmail));
            }
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                submissions.push({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Submission);
            }
        } else if (uploaderEmail) {
            // If only email is provided, return all submissions for that email
            q = query(submissionsRef, where("uploaderEmail", "==", uploaderEmail), orderBy("submittedAt", "desc"));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(doc => {
                submissions.push({ id: doc.id, ...doc.data() } as Submission);
            });
        }

        if (submissions.length === 0) {
            throw new functions.https.HttpsError("not-found", "No submissions found for the provided criteria.");
        }

        // If a single submission is found (by token or if only one by email), fetch its review
        let review: Review | null = null;
        if (submissions.length === 1 && submissions[0].status === "completed") {
            const reviewsRef = collection(db, "reviews");
            const reviewQuery = query(reviewsRef, where("submissionId", "==", submissions[0].id));
            const reviewSnapshot = await getDocs(reviewQuery);

            if (!reviewSnapshot.empty) {
                review = { id: reviewSnapshot.docs[0].id, ...reviewSnapshot.docs[0].data() } as Review;
            }
        }

        // Return either a single submission with its review, or an array of submissions
        if (submissions.length === 1) {
            return {
                success: true,
                submission: {
                    id: submissions[0].id,
                    artistName: submissions[0].artistName,
                    songTitle: submissions[0].songTitle,
                    status: submissions[0].status,
                    submittedAt: submissions[0].submittedAt,
                    reviewerId: submissions[0].reviewerId,
                },
                review: review ? {
                    id: review.id,
                    overallScore: review.overallScore,
                    strengths: review.strengths,
                    improvements: review.improvements,
                    summary: review.summary,
                    createdAt: review.createdAt,
                } : null,
            };
        } else {
            // Return a simplified list of submissions when multiple are found by email
            return {
                success: true,
                submissions: submissions.map(sub => ({
                    id: sub.id,
                    artistName: sub.artistName,
                    songTitle: sub.songTitle,
                    status: sub.status,
                    submittedAt: sub.submittedAt,
                })),
            };
        }
    } catch (error: any) {
        console.error("Error getting submission status by token/email:", error);
        if (error.code) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "An unexpected error occurred.", error.message);
    }
});
