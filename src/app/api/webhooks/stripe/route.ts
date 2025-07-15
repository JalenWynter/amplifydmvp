
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createSubmissionFromWebhook } from '@/lib/firebase/services';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Checkout session was successful! Fulfilling order...');

      // This is where we fulfill the purchase.
      // The metadata contains the submission details we passed earlier.
      const metadata = session.metadata;

      if (!metadata) {
        console.error('Webhook Error: No metadata found on checkout session.');
        return new NextResponse('Webhook Error: Missing metadata', { status: 400 });
      }

      try {
        // Here we create the actual submission record now that payment is confirmed.
        await createSubmissionFromWebhook({
          artistName: metadata.artistName,
          songTitle: metadata.songTitle,
          contactEmail: metadata.contactEmail,
          audioUrl: metadata.audioUrl,
          genre: metadata.genre,
          reviewerId: metadata.reviewerId,
        });
        console.log('Submission successfully created from webhook.');
      } catch (error) {
        console.error('Error creating submission from webhook:', error);
        return new NextResponse('Webhook Error: Could not create submission.', { status: 500 });
      }

      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new NextResponse(null, { status: 200 });
}
