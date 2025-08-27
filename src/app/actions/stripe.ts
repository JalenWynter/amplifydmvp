'use server';

import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { createTransaction } from '@/lib/firebase/services';
import { createSubmissionViaFunction } from '@/lib/firebase/submissions';

// Use test key for development, fallback for demo purposes
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_demo_key';
const stripe = stripeKey === 'sk_test_demo_key' ? null : new Stripe(stripeKey);

type CheckoutSessionPayload = {
    priceInCents: number;
    productName: string;
    productDescription: string;
    // We add metadata to link the payment to our internal data
    metadata: {
        artistName: string;
        songTitle: string;
        contactEmail: string;
        audioUrl: string;
        genre: string;
        reviewerId: string;
        packageId: string; // Add packageId to metadata
    }
};

export async function createCheckoutSession(payload: CheckoutSessionPayload): Promise<{ error?: string; url?: string | null; }> {
    const { priceInCents, productName, productDescription, metadata } = payload;

    const host = process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:9002';

    if (!stripe) {
        // For demo purposes, simulate successful payment
        console.log("Demo mode: Simulating successful payment");
        try {
            // Create transaction record
            await createTransaction({
                stripeSessionId: `demo_session_${Date.now()}`,
                artistName: metadata.artistName,
                songTitle: metadata.songTitle,
                contactEmail: metadata.contactEmail,
                amount: priceInCents,
                currency: 'usd',
                status: 'completed' as const, // Mark as completed for demo
                reviewerId: metadata.reviewerId,
                packageId: metadata.packageId,
            });

            // Create submission record
            await createSubmissionViaFunction({
                artistName: metadata.artistName,
                songTitle: metadata.songTitle,
                contactEmail: metadata.contactEmail,
                audioUrl: metadata.audioUrl,
                genre: metadata.genre,
                reviewerId: metadata.reviewerId,
                packageId: metadata.packageId,
                paymentIntentId: `demo_payment_${Date.now()}`,
                amount: priceInCents,
                currency: 'usd',
                stripeSessionId: `demo_session_${Date.now()}`,
                packageName: productName,
                packageDescription: productDescription,
            });

            console.log("Demo mode: Transaction and submission created successfully");
            return { url: `${host}/submit-success?demo=true` };
        } catch (error) {
            console.error("Failed to create demo transaction/submission:", error);
            return { error: 'Failed to create demo transaction/submission.' };
        }
    }

    // NOTE: Submissions are created ONLY via Stripe webhook after payment confirmation
    // This ensures consistent behavior across development and production environments

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: productName,
                            description: productDescription,
                        },
                        unit_amount: priceInCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${host}/submit-success`,
            cancel_url: `${host}/`, // Redirect to home page on cancellation
            metadata: metadata, // Pass our custom metadata to the session
        });
        
        // Create transaction record
        try {
            await createTransaction({
                stripeSessionId: session.id,
                artistName: metadata.artistName,
                songTitle: metadata.songTitle,
                contactEmail: metadata.contactEmail,
                amount: priceInCents,
                currency: 'usd',
                status: 'pending' as const,
                reviewerId: metadata.reviewerId,
                packageId: metadata.packageId,
            });
            console.log("Transaction record created successfully");
        } catch (transactionError) {
            console.error("Failed to create transaction record:", transactionError);
            // Continue with checkout even if transaction creation fails
        }

        // Create submission record immediately (backup to webhook)
        try {
            await createSubmissionViaFunction({
                artistName: metadata.artistName,
                songTitle: metadata.songTitle,
                contactEmail: metadata.contactEmail,
                audioUrl: metadata.audioUrl,
                genre: metadata.genre,
                reviewerId: metadata.reviewerId,
                packageId: metadata.packageId,
                paymentIntentId: session.payment_intent as string,
                amount: priceInCents,
                currency: 'usd',
                stripeSessionId: session.id,
                packageName: productName,
                packageDescription: productDescription,
            });
            console.log("Submission record created successfully");
        } catch (submissionError) {
            console.error("Failed to create submission record:", submissionError);
            // Continue with checkout even if submission creation fails
        }
        
        return { url: session.url };

    } catch (error: unknown) {
        console.error("Stripe session creation failed:", error instanceof Error ? error.message : error);
        return { error: error instanceof Error ? error.message : "An unknown error occurred." };
    }
}
