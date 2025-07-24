'use server';

import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { createTransaction } from '@/lib/firebase/services';

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
        
        // Create transaction record - temporarily commented out for deployment
        // await createTransaction({
        //     stripeSessionId: session.id,
        //     artistName: metadata.artistName,
        //     songTitle: metadata.songTitle,
        //     contactEmail: metadata.contactEmail,
        //     amount: priceInCents,
        //     currency: 'usd',
        //     status: 'pending' as const,
        //     reviewerId: metadata.reviewerId,
        //     packageId: metadata.packageId,
        // });
        
        return { url: session.url };

    } catch (error: unknown) {
        console.error("Stripe session creation failed:", error instanceof Error ? error.message : error);
        return { error: error instanceof Error ? error.message : "An unknown error occurred." };
    }
}
