
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { USER_ROLE, USER_STATUS, APPLICATION_STATUS, DEFAULTS } from "./shared/statuses";
import type { Application, User, Reviewer } from "./shared/types";

admin.initializeApp();

const db = admin.firestore();

export const approveApplication = functions.https.onCall(async (data, context) => {
    const { applicationId } = data;

    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    // For added security, you might want to check if the caller is an admin
    // const callerUid = context.auth.uid;
    // const userRecord = await admin.auth().getUser(callerUid);
    // if (userRecord.customClaims?.role !== USER_ROLE.ADMIN) {
    //     throw new functions.https.HttpsError("permission-denied", "Only admins can approve applications.");
    // }

    const appRef = db.collection("applications").doc(applicationId);

    return db.runTransaction(async (transaction) => {
        const appDoc = await transaction.get(appRef);
        if (!appDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Application not found.");
        }

        const appData = appDoc.data() as Application;

        if (appData.status === APPLICATION_STATUS.APPROVED) {
            throw new functions.https.HttpsError("failed-precondition", "Application is already approved.");
        }

        let userId: string;
        let userExists = false;

        try {
            const userRecord = await admin.auth().getUserByEmail(appData.email);
            userId = userRecord.uid;
            userExists = true;
        } catch (error: unknown) {
            if (error instanceof Error && error.code === "auth/user-not-found") {
                const newUser = await admin.auth().createUser({
                    email: appData.email,
                    emailVerified: false, // Or true, if you send a verification email
                    displayName: appData.name,
                });
                userId = newUser.uid;
            } else {
                throw new functions.https.HttpsError("internal", "Error checking for existing user.", error instanceof Error ? error.message : String(error));
            }
        }

        const batch = db.batch();

        // Update application
        batch.update(appRef, {
            status: APPLICATION_STATUS.APPROVED,
            userId: userId,
        });

        // Create user document if it doesn't exist
        if (!userExists) {
            const userDocRef = db.collection("users").doc(userId);
            const newUser: Omit<User, "id"> = {
                name: appData.name,
                email: appData.email,
                role: USER_ROLE.REVIEWER,
                status: USER_STATUS.ACTIVE,
                joinedAt: new Date().toISOString(),
                avatarUrl: "",
            };
            batch.set(userDocRef, newUser);
        }

        // Create reviewer document
        const reviewerDocRef = db.collection("reviewers").doc(userId);
        const newReviewer: Reviewer = {
            id: userId,
            name: appData.name,
            avatarUrl: "",
            dataAiHint: "",
            turnaround: DEFAULTS.TURNAROUND,
            genres: [],
            experience: appData.musicBackground,
            packages: [],
        };
        batch.set(reviewerDocRef, newReviewer);

        await batch.commit();

        // Send password reset email
        if (!userExists) {
            const link = await admin.auth().generatePasswordResetLink(appData.email);
            // Here you would use a service like SendGrid or Nodemailer to send the email
            console.log(`Password reset link for ${appData.email}: ${link}`);
        }

        return { success: true, userId: userId };
    });
});

export const createUserDocument = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName } = user;

    // Create a user document in Firestore
    const newUser: Omit<User, "id"> = {
        name: displayName || "New User",
        email: email || "",
        role: USER_ROLE.REVIEWER, // Default role for new sign-ups
        status: USER_STATUS.ACTIVE,
        joinedAt: new Date().toISOString(),
        avatarUrl: "", // You might want a default avatar URL here
    };

    try {
        await db.collection("users").doc(uid).set(newUser);
        console.log(`User document created for ${uid} with role ${USER_ROLE.REVIEWER}`);
    } catch (error) {
        console.error(`Error creating user document for ${uid}:`, error);
    }
});


