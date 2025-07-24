// functions/src/utils/stripe.ts

import Stripe from 'stripe';
import * as functions from "firebase-functions";

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2024-06-20',
});

export { stripe };
