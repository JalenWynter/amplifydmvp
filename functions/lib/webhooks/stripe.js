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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
// import { sendEmail } from "../utils/emailService"; // TODO: Fix email service import
const db = admin.firestore();
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    var _a;
    const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-06-30.basil',
    });
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'test_webhook_secret';
    let event;
    try {
        const sig = req.headers['stripe-signature'];
        if (typeof sig !== 'string') {
            console.error(`Webhook Error: Invalid stripe-signature header.`);
            res.status(400).send(`Webhook Error: Invalid stripe-signature header.`);
            return;
        }
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    }
    catch (err) {
        console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
        res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`);
        return;
    }
    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log(`Checkout session completed: ${session.id}`);
        const { artistName, songTitle, contactEmail, audioUrl, genre, reviewerId, packageId } = session.metadata || {};
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : (_a = session.payment_intent) === null || _a === void 0 ? void 0 : _a.id;
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
                status: "pending",
                submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Submission created for ${songTitle} by ${artistName} with tracking token ${trackingToken}`);
            // TODO: Send confirmation email to uploader
            console.log(`Submission confirmed: ${songTitle} by ${artistName} with tracking token ${trackingToken}`);
            // Send notification email to reviewer
            const reviewerDoc = await db.collection("reviewers").doc(reviewerId).get();
            if (reviewerDoc.exists) {
                const reviewerData = reviewerDoc.data();
                const reviewerEmail = reviewerData === null || reviewerData === void 0 ? void 0 : reviewerData.email;
                const reviewerName = (reviewerData === null || reviewerData === void 0 ? void 0 : reviewerData.name) || "Reviewer";
                if (reviewerEmail) {
                    // TODO: Send email notification to reviewer
                    console.log(`Reviewer ${reviewerName} (${reviewerEmail}) notified of new submission: ${songTitle} by ${artistName}`);
                }
            }
        }
        catch (error) {
            console.error("Error creating submission in Firestore or sending email:", error);
            res.status(500).send("Internal Server Error");
            return;
        }
    }
    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
    return;
});
//# sourceMappingURL=stripe.js.map