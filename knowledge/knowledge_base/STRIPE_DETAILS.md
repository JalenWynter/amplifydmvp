# Stripe Details

This document details the integration of Stripe for payment processing in the Amplifyd application.

## Purpose
- Facilitate secure payments from artists for music review packages.
- Handle webhook events from Stripe to update submission statuses and trigger backend processes.

## Key Components

### 1. Environment Variables
- `STRIPE_SECRET_KEY`: Your secret API key for server-side Stripe operations. **Never expose this client-side.**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your publishable API key for client-side Stripe operations.
- `STRIPE_WEBHOOK_SECRET`: Secret used to verify Stripe webhook events.

### 2. Client-Side Integration
- Uses `stripe.js` (implicitly via `@stripe/stripe-js` or similar) for creating Stripe Checkout sessions.
- Artists are redirected to Stripe's hosted checkout page for secure payment processing.

### 3. Server-Side Integration (Next.js API Routes)
- **Stripe API Calls**: Made from Next.js API routes (e.g., `src/app/actions/stripe.ts` or dedicated API routes).
- **Checkout Session Creation**: When an artist initiates a payment, a Stripe Checkout Session is created on the server-side.
- **Webhook Endpoint**: `src/app/api/webhooks/stripe/route.ts` (or similar) is configured as a Stripe webhook endpoint.
    - This endpoint listens for events like `checkout.session.completed`.
    - It verifies the webhook signature using `STRIPE_WEBHOOK_SECRET` to ensure authenticity.
    - Upon successful payment, it updates the corresponding `submission` document in Firestore and creates a `transaction` record.

### 4. Data Models (Firestore)
- **`submissions` Collection**: Updated with `transactionId` and status changes upon payment.
- **`transactions` Collection**: Stores a record of each payment, including `stripeSessionId`, amount, status, and links to the associated `submission`.

## Local Testing with Stripe CLI
- The `GETTING_STARTED_GUIDE.md` provides detailed instructions on how to use the Stripe CLI to forward webhook events to your local development server (`http://localhost:9002/api/webhooks/stripe`).
- This allows for comprehensive testing of the payment flow without deploying to production.

## Security Considerations
- **Secret Key Protection**: `STRIPE_SECRET_KEY` is kept server-side and never exposed to the client.
- **Webhook Signature Verification**: Essential for ensuring that incoming webhook events are genuinely from Stripe and have not been tampered with.
- **HTTPS**: All production communication with Stripe should occur over HTTPS.

Stripe integration ensures a secure, reliable, and scalable payment solution for the Amplifyd platform.
