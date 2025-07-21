
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createSubmissionFromWebhook, getTransactionBySessionId, updateTransactionStatus, getTransactions } from '@/lib/firebase/services';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
    return new NextResponse(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Checkout session was successful! Fulfilling order...');

      // Update transaction status
      try {
        const transaction = await getTransactionBySessionId(session.id);
        if (transaction && transaction.id) {
          await updateTransactionStatus(transaction.id, 'completed', {
            stripePaymentIntentId: session.payment_intent as string,
          });
          console.log(`Transaction ${transaction.id} marked as completed.`);
        }
      } catch (error) {
        console.error('Error updating transaction status:', error);
      }

      // This is where we fulfill the purchase.
      // The metadata contains the submission details we passed earlier.
      const metadata = session.metadata;

      if (!metadata) {
        console.error('Webhook Error: No metadata found on checkout session.');
        return new NextResponse('Webhook Error: Missing metadata', { status: 400 });
      }

      try {
        // Here we create the actual submission record now that payment is confirmed.
        const submission = await createSubmissionFromWebhook({
          artistName: metadata.artistName,
          songTitle: metadata.songTitle,
          contactEmail: metadata.contactEmail,
          audioUrl: metadata.audioUrl,
          genre: metadata.genre,
          reviewerId: metadata.reviewerId,
          packageId: metadata.packageId,
        });
        
        // Update transaction with submission ID
        const transaction = await getTransactionBySessionId(session.id);
        if (transaction && typeof transaction.id === 'string') {
          await updateTransactionStatus(transaction.id, 'completed', {
            submissionId: submission.id,
          });
        }
        
        console.log('Submission successfully created from webhook.');
      } catch (error) {
        console.error('Error creating submission from webhook:', error);
        
        // Mark transaction as failed
        const transaction = await getTransactionBySessionId(session.id);
        if (transaction && typeof transaction.id === 'string') {
          await updateTransactionStatus(transaction.id, 'failed', {
            failureReason: 'Failed to create submission',
            stripeError: (error as Error).message,
          });
        }
        
        return new NextResponse('Webhook Error: Could not create submission.', { status: 500 });
      }

      break;
      
    case 'checkout.session.expired':
      const expiredSession = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout session expired:', expiredSession.id);
      
      try {
        const transaction = await getTransactionBySessionId(expiredSession.id);
        if (transaction && typeof transaction.id === 'string') {
          await updateTransactionStatus(transaction.id, 'cancelled', {
            failureReason: 'Session expired',
          });
        }
      } catch (error) {
        console.error('Error updating expired session:', error);
      }
      
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed:', failedPayment.id);
      
      try {
        // Find transaction by payment intent ID
        const transactions = await getTransactions();
        const transaction = transactions.find(t => t.stripePaymentIntentId === failedPayment.id);
        if (transaction && typeof transaction.id === 'string') {
          await updateTransactionStatus(transaction.id, 'failed', {
            failureReason: 'Payment failed',
            stripeError: failedPayment.last_payment_error?.message || 'Unknown payment error',
          });
        }
      } catch (error) {
        console.error('Error updating failed payment:', error);
      }
      
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new NextResponse(null, { status: 200 });
}
