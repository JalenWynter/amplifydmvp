'use server';

import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { createSubmissionFromWebhook } from '@/lib/firebase/services';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

    if (!process.env.STRIPE_SECRET_KEY) {
        return { error: 'Stripe secret key is not configured.' };
    }

    // --- DEVELOPMENT ONLY SIMULATION ---
    // In a development environment where we can't easily test webhooks,
    // we'll create the submission record immediately to allow for end-to-end testing.
    // In production, this block will be skipped, and we will rely exclusively
    // on the secure Stripe webhook to create the submission.
    if (process.env.NODE_ENV === 'development') {
        console.log('--- DEVELOPMENT MODE: Simulating successful payment webhook ---');
        try {
            await createSubmissionFromWebhook({
                artistName: metadata.artistName,
                songTitle: metadata.songTitle,
                contactEmail: metadata.contactEmail,
                audioUrl: metadata.audioUrl,
                genre: metadata.genre,
                reviewerId: metadata.reviewerId,
            });
            console.log('--- DEVELOPMENT MODE: Submission successfully created for testing. ---');
        } catch (error) {
            console.error('DEVELOPMENT SIMULATION FAILED:', error);
            // We can choose to stop the process here in dev if the simulation fails.
            return { error: 'Development simulation failed. Check server logs.' };
        }
    }
    // --- END OF DEVELOPMENT ONLY SIMULATION ---

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
        
        return { url: session.url };

    } catch (error: any) {
        console.error("Stripe session creation failed:", error.message);
        return { error: error.message };
    }
}
