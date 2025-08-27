import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const createPayout = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  // Get user role from Firestore
  const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can create payouts.');
  }

  const { reviewerId, reviewer, amount, amountInCents, paymentMethod, reviews } = request.data;

  if (!reviewerId || !reviewer || !amount || !amountInCents || !paymentMethod) {
    throw new HttpsError('invalid-argument', 'Missing required payout fields.');
  }

  try {
    const newPayout = {
      reviewerId,
      reviewer,
      amount,
      amountInCents,
      paymentMethod,
      reviews: reviews || [],
      status: 'Pending',
      date: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await admin.firestore().collection('payouts').add(newPayout);

    return { success: true, id: docRef.id, message: 'Payout created successfully.' };
  } catch (error) {
    console.error('Error creating payout:', error);
    throw new HttpsError('internal', 'Failed to create payout.');
  }
});
