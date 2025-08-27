import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const updatePayoutStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  // Get user role from Firestore
  const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can update payout status.');
  }

  const { payoutId, status } = request.data;

  if (!payoutId || !status) {
    throw new HttpsError('invalid-argument', 'Missing payoutId or status.');
  }

  try {
    await admin.firestore().collection('payouts').doc(payoutId).update({
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Payout status updated successfully.' };
  } catch (error) {
    console.error('Error updating payout status:', error);
    throw new HttpsError('internal', 'Failed to update payout status.');
  }
});