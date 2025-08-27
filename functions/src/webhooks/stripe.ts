import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from 'stripe';
// import { sendEmail } from "../utils/emailService"; // TODO: Fix email service import

const db = admin.firestore();

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-06-30.basil',
    });
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'test_webhook_secret';

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

            // TODO: Send confirmation email to uploader
            console.log(`Submission confirmed: ${songTitle} by ${artistName} with tracking token ${trackingToken}`);

            // Send notification email to reviewer
            const reviewerDoc = await db.collection("reviewers").doc(reviewerId).get();
            if (reviewerDoc.exists) {
                const reviewerData = reviewerDoc.data();
                const reviewerEmail = reviewerData?.email;
                const reviewerName = reviewerData?.name || "Reviewer";

                if (reviewerEmail) {
                    // TODO: Send email notification to reviewer
                    console.log(`Reviewer ${reviewerName} (${reviewerEmail}) notified of new submission: ${songTitle} by ${artistName}`);
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
