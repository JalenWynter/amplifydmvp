import * as functions from "firebase-functions";
import { stripe } from "../utils/stripe";

export const createPaymentIntent = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const { amount, currency, metadata } = data;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "Amount must be a positive number.");
    }
    if (!currency || typeof currency !== 'string') {
        throw new functions.https.HttpsError("invalid-argument", "Currency must be a string.");
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // amount in cents
            currency: currency,
            metadata: metadata,
            // Add idempotency key if needed, though callable functions handle some of this
            // idempotency_key: context.rawRequest.rawBody.toString(), // Example, adjust as needed
        });

        return { clientSecret: paymentIntent.client_secret };
    } catch (error: any) {
        console.error("Error creating payment intent:", error);
        throw new functions.https.HttpsError("internal", "Unable to create payment intent.", error.message);
    }
});
