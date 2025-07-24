import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
export const createPayout = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth || ((_a = (await admin.auth().getUser(context.auth.uid)).customClaims) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
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
    }
    catch (error) {
        console.error('Error creating payout:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create payout.', error);
    }
});
//# sourceMappingURL=createPayout.js.map