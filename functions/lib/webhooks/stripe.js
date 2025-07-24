import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
const stripe = new Stripe(functions.config().stripe.secret_key, {});
export const stripeWebhook = functions.https.onRequest(async (request, response) => {
    const sig = request.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(request.rawBody, sig, functions.config().stripe.webhook_secret);
    }
    catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Checkout Session Completed:', session.id);
            // Extract metadata from the session
            const metadata = session.metadata;
            if (!metadata) {
                console.error('Metadata missing from checkout session.');
                response.status(400).send('Metadata missing.');
                return;
            }
            const { artistName, songTitle, contactEmail, audioUrl, genre, reviewerId, packageId } = metadata;
            if (!artistName || !songTitle || !contactEmail || !audioUrl || !genre || !reviewerId || !packageId) {
                console.error('Missing required metadata fields for submission.', metadata);
                response.status(400).send('Missing required metadata fields.');
                return;
            }
            try {
                await admin.firestore().collection('submissions').add({
                    artistName,
                    songTitle,
                    contactEmail,
                    audioUrl,
                    genre,
                    reviewerId,
                    packageId,
                    status: 'Pending Review',
                    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
                    paymentIntentId: session.payment_intent,
                    stripeCheckoutSessionId: session.id, // Store checkout session ID
                });
                console.log('Submission created in Firestore.');
            }
            catch (firestoreError) {
                console.error('Error writing submission to Firestore:', firestoreError);
                response.status(500).send('Error writing submission to Firestore.');
                return;
            }
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    // Return a 200 response to acknowledge receipt of the event
    response.json({ received: true });
});
//# sourceMappingURL=stripe.js.map