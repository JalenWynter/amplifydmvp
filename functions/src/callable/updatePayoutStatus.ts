import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const updatePayoutStatus = functions.https.onCall(async (data: { payoutId: string; status: string; }, context: functions.https.CallableContext) => {
  if (!context.auth || (await admin.auth().getUser(context.auth.uid)).customClaims?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can update payout status.');
  }

  const { payoutId, status } = data;

  if (!payoutId || !status) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing payoutId or status.');
  }

  try {
    const payoutRef = admin.firestore().collection('payouts').doc(payoutId);
    const updateData: { status: string; paidDate?: admin.firestore.FieldValue } = { status };

    if (status === 'Paid') {
      updateData.paidDate = admin.firestore.FieldValue.serverTimestamp();
    }

    await payoutRef.update(updateData);

    return { success: true, message: 'Payout status updated successfully.' };
  } catch (error) {
    console.error('Error updating payout status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update payout status.', error);
  }
});
