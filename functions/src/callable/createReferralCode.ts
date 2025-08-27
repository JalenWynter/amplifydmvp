import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export const createReferralCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  // Get user role from Firestore
  const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can create referral codes.');
  }

  const { associatedUser, referrerId } = request.data;

  if (!associatedUser || !referrerId) {
    throw new HttpsError('invalid-argument', 'Missing associatedUser or referrerId.');
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
    throw new HttpsError('internal', 'Failed to create referral code.');
  }
});