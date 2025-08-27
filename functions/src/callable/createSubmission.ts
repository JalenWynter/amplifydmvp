import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const createSubmission = onCall(async (request) => {
    const { 
        artistName, 
        songTitle, 
        contactEmail, 
        audioUrl, 
        genre, 
        reviewerId, 
        packageId, 
        paymentIntentId,
        amount,
        currency,
        stripeSessionId,
        packageName,
        packageDescription
    } = request.data;

    if (!artistName || !songTitle || !contactEmail || !audioUrl || !genre || !reviewerId || !packageId) {
        throw new Error("Missing required submission data");
    }

    try {
        const submissionsRef = db.collection("submissions");

        // Generate a unique tracking token
        const trackingToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const submissionData = {
            artistName,
            songTitle,
            uploaderEmail: contactEmail,
            songUrl: audioUrl,
            genre,
            reviewerId,
            packageId,
            paymentIntentId: paymentIntentId || `demo_payment_${Date.now()}`,
            stripeSessionId: stripeSessionId || `demo_session_${Date.now()}`,
            amount: amount || 0,
            currency: currency || 'usd',
            packageName: packageName || 'Unknown Package',
            packageDescription: packageDescription || '',
            trackingToken,
            status: "pending", // Initial status
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            contactEmail: contactEmail,
            audioUrl: audioUrl,
        };

        const docRef = await submissionsRef.add(submissionData);

        console.log(`Submission created for ${songTitle} by ${artistName} with tracking token ${trackingToken}`);

        // Send notification email to reviewer (TODO: implement email service)
        const reviewerDoc = await db.collection("reviewers").doc(reviewerId).get();
        if (reviewerDoc.exists) {
            const reviewerData = reviewerDoc.data();
            const reviewerEmail = reviewerData?.email;
            const reviewerName = reviewerData?.name || "Reviewer";

            if (reviewerEmail) {
                console.log(`Reviewer ${reviewerName} (${reviewerEmail}) notified of new submission: ${songTitle} by ${artistName}`);
            }
        }

        return {
            success: true,
            submissionId: docRef.id,
            trackingToken,
            message: `Submission created successfully for ${songTitle} by ${artistName}`
        };

    } catch (error) {
        console.error("Error creating submission:", error);
        throw new Error(`Failed to create submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
