import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const createPayout = functions.https.onCall(async (data: { reviewerId: string; reviewer: { id: string; name: string; email: string; avatarUrl?: string; }; amount: number; amountInCents: number; paymentMethod: string; reviews?: any[]; }, context: functions.https.CallableContext) => {
  if (!context.auth || (await admin.auth().getUser(context.auth.uid)).customClaims?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can create payouts.');
  }

  const { reviewerId, reviewer, amount, amountInCents, paymentMethod, reviews } = data;

  if (!reviewerId || !reviewer || !amount || !amountInCents || !paymentMethod) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required payout fields.');
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
    throw new functions.https.HttpsError('internal', 'Failed to create payout.', error);
  }
});
