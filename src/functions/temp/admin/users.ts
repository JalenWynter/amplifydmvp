import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db, auth } from "../../utils/firebaseAdmin";
import { USER_ROLE, USER_STATUS } from "../../../lib/constants/statuses";
import type { User } from "../../../lib/types";

export const updateUserRole = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const callerUid = context.auth.uid;
    const { userId, newRole } = data;

    // 1. Security Check: Only admins can change roles
    const callerUserDoc = await db.collection("users").doc(callerUid).get();
    if (!callerUserDoc.exists || callerUserDoc.data()?.role !== USER_ROLE.ADMIN) {
        throw new functions.https.HttpsError("permission-denied", "Only administrators can update user roles.");
    }

    // 2. Input Validation
    if (!userId || !Object.values(USER_ROLE).includes(newRole)) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid user ID or role provided.");
    }

    try {
        // Update custom claims in Firebase Authentication
        await auth.setCustomUserClaims(userId, { role: newRole });

        // Update role in Firestore user document
        await db.collection("users").doc(userId).update({ role: newRole });

        // If changing to reviewer, ensure reviewer document exists (or create it)
        if (newRole === USER_ROLE.REVIEWER) {
            const reviewerDocRef = db.collection("reviewers").doc(userId);
            const reviewerDoc = await reviewerDocRef.get();
            if (!reviewerDoc.exists) {
                const userRecord = await auth.getUser(userId);
                const newReviewer: Partial<User> = {
                    id: userId,
                    name: userRecord.displayName || "",
                    avatarUrl: userRecord.photoURL || "",
                    // Add other default reviewer fields as necessary
                };
                await reviewerDocRef.set(newReviewer, { merge: true });
            }
        }

        console.log(`User ${userId} role updated to ${newRole} by admin ${callerUid}`);
        return { success: true };
    } catch (error: unknown) {
        console.error(`Error updating user role for ${userId}:`, error);
        let errorMessage = "Failed to update user role.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new functions.https.HttpsError("internal", errorMessage);
    }
});

export const updateUserStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const callerUid = context.auth.uid;
    const { userId, newStatus } = data;

    // 1. Security Check: Only admins can change user status
    const callerUserDoc = await db.collection("users").doc(callerUid).get();
    if (!callerUserDoc.exists || callerUserDoc.data()?.role !== USER_ROLE.ADMIN) {
        throw new functions.https.HttpsError("permission-denied", "Only administrators can update user status.");
    }

    // 2. Input Validation
    if (!userId || !Object.values(USER_STATUS).includes(newStatus)) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid user ID or status provided.");
    }

    try {
        // Update status in Firestore user document
        await db.collection("users").doc(userId).update({ status: newStatus });

        // Optionally, disable/enable user in Firebase Auth
        await auth.updateUser(userId, { disabled: newStatus === USER_STATUS.SUSPENDED });

        console.log(`User ${userId} status updated to ${newStatus} by admin ${callerUid}`);
        return { success: true };
    } catch (error: unknown) {
        console.error(`Error updating user status for ${userId}:`, error);
        let errorMessage = "Failed to update user status.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new functions.https.HttpsError("internal", errorMessage);
    }
});
