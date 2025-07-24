import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
export const submitApplication = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { name, email, userId } = data;
    if (!name || !email || !userId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required application fields.');
    }
    try {
        await admin.firestore().collection('applications').add({
            userId: userId,
            name: name,
            email: email,
            status: 'pending',
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, message: 'Application submitted successfully.' };
    }
    catch (error) {
        console.error('Error submitting application:', error);
        throw new functions.https.HttpsError('internal', 'Failed to submit application.', error);
    }
});
//# sourceMappingURL=submitApplication.js.map