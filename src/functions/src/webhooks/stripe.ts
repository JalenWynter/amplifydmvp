import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from 'stripe';
import { sendEmail } from "../utils/emailService"; // Import sendEmail

const db = admin.firestore();

export const onPaymentSucceeded = functions.https.onRequest(async (req, res) => {
    const stripe = new Stripe(functions.config().stripe.secret_key, {
        apiVersion: '2024-06-20',
    });
    const endpointSecret = functions.config().stripe.webhook_secret;

    let event: Stripe.Event;

    try {
        const sig = req.headers['stripe-signature'];
        if (typeof sig !== 'string') {
            console.error(`Webhook Error: Invalid stripe-signature header.`);
            res.status(400).send(`Webhook Error: Invalid stripe-signature header.`);
            return;
        }
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err: unknown) {
        console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
        res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`);
        return;
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session completed: ${session.id}`);

        const { artistName, songTitle, contactEmail, audioUrl, genre, reviewerId, packageId } = session.metadata || {};
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

        if (!artistName || !songTitle || !contactEmail || !audioUrl || !genre || !reviewerId || !packageId || !paymentIntentId) {
            console.error("Missing metadata in Stripe session:", session.metadata);
            res.status(400).send("Missing required metadata.");
            return;
        }

        try {
            const submissionsRef = db.collection("submissions");

            // Generate a unique tracking token
            const trackingToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            await submissionsRef.add({
                artistName,
                songTitle,
                uploaderEmail: contactEmail,
                songUrl: audioUrl,
                genre,
                reviewerId,
                packageId,
                paymentIntentId,
                trackingToken,
                status: "pending", // Initial status
                submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`Submission created for ${songTitle} by ${artistName} with tracking token ${trackingToken}`);

            // Send confirmation email to uploader
            const submissionStatusUrl = `https://your-app-domain.com/submission-status?token=${trackingToken}&email=${encodeURIComponent(contactEmail)}`; // Replace with your actual domain
            const emailSubject = `Amplifyd: Submission Confirmation for ${songTitle}`;
            const emailHtml = `
                <p>Dear ${artistName},</p>
                <p>Thank you for your submission <strong>${songTitle}</strong> to Amplifyd!</p>
                <p>Your submission is now pending review. You can track its status here:</p>
                <p><a href="${submissionStatusUrl}">Track Your Submission</a></p>
                <p>Your unique tracking token is: <strong>${trackingToken}</strong></p>
                <p>We will notify you once your review is complete.</p>
                <p>Best regards,</p>
                <p>The Amplifyd Team</p>
            `;

            await sendEmail(contactEmail, emailSubject, emailHtml);
            console.log(`Confirmation email sent to ${contactEmail} for submission ${songTitle}`);

            // Send notification email to reviewer
            const reviewerDoc = await db.collection("reviewers").doc(reviewerId).get();
            if (reviewerDoc.exists) {
                const reviewerData = reviewerDoc.data();
                const reviewerEmail = reviewerData?.email;
                const reviewerName = reviewerData?.name || "Reviewer";

                if (reviewerEmail) {
                    const reviewerEmailSubject = `Amplifyd: New Submission Assigned - ${songTitle}`;
                    const reviewerEmailHtml = `
                        <p>Dear ${reviewerName},</p>
                        <p>A new submission has been assigned to you for review:</p>
                        <p><strong>Artist:</strong> ${artistName}</p>
                        <p><strong>Song Title:</strong> ${songTitle}</p>
                        <p><strong>Genre:</strong> ${genre}</p>
                        <p>Please log in to your reviewer dashboard to access and review the submission.</p>
                        <p><a href="https://your-app-domain.com/dashboard/reviewer">Go to Reviewer Dashboard</a></p> <!-- Replace with your actual domain -->
                        <p>Best regards,</p>
                        <p>The Amplifyd Team</p>
                    `;
                    await sendEmail(reviewerEmail, reviewerEmailSubject, reviewerEmailHtml);
                    console.log(`New submission notification email sent to reviewer ${reviewerEmail} for submission ${songTitle}`);
                }
            }

        } catch (error) {
            console.error("Error creating submission in Firestore or sending email:", error);
            res.status(500).send("Internal Server Error");
            return;
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
    return;
});
