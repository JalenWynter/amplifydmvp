import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const updateReviewerProfile = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const { uid } = context.auth;
    const { name, turnaround, experience, genres } = data;

    const reviewerRef = db.collection("reviewers").doc(uid);

    try {
        await reviewerRef.update({
            name,
            turnaround,
            experience,
            genres,
        });
        return { success: true };
    } catch (error) {
        console.error(`Error updating reviewer profile for ${uid}:`, error);
        throw new functions.https.HttpsError("internal", "Error updating profile.", error);
    }
});

export const addPackage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const { uid } = context.auth;
    const reviewerRef = db.collection("reviewers").doc(uid);

    try {
        const reviewerDoc = await reviewerRef.get();
        if (!reviewerDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Reviewer profile not found.");
        }

        const packages = reviewerDoc.data()?.packages || [];
        if (packages.length >= 5) {
            throw new functions.https.HttpsError("failed-precondition", "Maximum number of packages reached.");
        }

        const newPackage = { ...data, id: db.collection('packages').doc().id };
        await reviewerRef.update({
            packages: admin.firestore.FieldValue.arrayUnion(newPackage)
        });

        return { success: true, packageId: newPackage.id };
    } catch (error) {
        console.error(`Error adding package for ${uid}:`, error);
        throw new functions.https.HttpsError("internal", "Error adding package.", error);
    }
});

export const updatePackage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const { uid } = context.auth;
    const { packageId, ...packageData } = data;
    const reviewerRef = db.collection("reviewers").doc(uid);

    try {
        const reviewerDoc = await reviewerRef.get();
        if (!reviewerDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Reviewer profile not found.");
        }

        const packages = reviewerDoc.data()?.packages || [];
        const packageIndex = packages.findIndex((p: any) => p.id === packageId);

        if (packageIndex === -1) {
            throw new functions.https.HttpsError("not-found", "Package not found.");
        }

        packages[packageIndex] = { ...packages[packageIndex], ...packageData };

        await reviewerRef.update({ packages });

        return { success: true };
    } catch (error) {
        console.error(`Error updating package ${packageId} for ${uid}:`, error);
        throw new functions.https.HttpsError("internal", "Error updating package.", error);
    }
});

export const deletePackage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const { uid } = context.auth;
    const { packageId } = data;
    const reviewerRef = db.collection("reviewers").doc(uid);

    try {
        const reviewerDoc = await reviewerRef.get();
        if (!reviewerDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Reviewer profile not found.");
        }

        const packages = reviewerDoc.data()?.packages || [];
        const updatedPackages = packages.filter((p: any) => p.id !== packageId);

        if (packages.length === updatedPackages.length) {
            throw new functions.https.HttpsError("not-found", "Package not found.");
        }

        await reviewerRef.update({ packages: updatedPackages });

        return { success: true };
    } catch (error) {
        console.error(`Error deleting package ${packageId} for ${uid}:`, error);
        throw new functions.https.HttpsError("internal", "Error deleting package.", error);
    }
});

export const updateReviewerPaidStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    // Ensure the caller is an admin
    const callerUid = context.auth.uid;
    const userDoc = await db.collection("users").doc(callerUid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "Only admins can update reviewer paid status.");
    }

    const { reviewerId, amount } = data;

    if (!reviewerId || typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "Reviewer ID and a positive amount are required.");
    }

    const reviewerRef = db.collection("reviewers").doc(reviewerId);

    try {
        await reviewerRef.update({
            totalPaid: admin.firestore.FieldValue.increment(amount),
        });
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating paid status for reviewer ${reviewerId}:`, error);
        throw new functions.https.HttpsError("internal", "Error updating reviewer paid status.", error.message);
    }
});
