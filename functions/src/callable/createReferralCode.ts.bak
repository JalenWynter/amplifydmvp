import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export const createReferralCode = functions.https.onCall(async (data: { associatedUser: string; referrerId: string; }, context: functions.https.CallableContext) => {
  if (!context.auth || (await admin.auth().getUser(context.auth.uid)).customClaims?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can create referral codes.');
  }

  const { associatedUser, referrerId } = data;

  if (!associatedUser || !referrerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing associatedUser or referrerId.');
  }

  try {
    const code = `INVITE-${uuidv4().slice(0, 8).toUpperCase()}`;
    await admin.firestore().collection('referralCodes').add({
      code: code,
      referrerId: referrerId,
      associatedUser: associatedUser,
      status: 'Active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, code: code, message: 'Referral code created successfully.' };
  } catch (error) {
    console.error('Error creating referral code:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create referral code.', error);
  }
});
