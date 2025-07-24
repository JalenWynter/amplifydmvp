import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// This function generates a secure, short-lived URL for a client to upload a file directly to Firebase Storage.
export const getSignedUploadUrl = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check: Ensure the user is authenticated.
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to upload a file.");
    }

    // 2. Input Validation: Ensure the necessary data (fileName, contentType) is provided.
    const { fileName, contentType } = data;
    if (!fileName || !contentType) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'fileName' and 'contentType'.");
    }

    // 3. Prepare for Signed URL Generation
    const bucket = admin.storage().bucket();
    // Create a unique path for the upload to prevent overwrites.
    const filePath = `submissions/${context.auth.uid}/${Date.now()}-${fileName}`;
    const file = bucket.file(filePath);

    // 4. Define Signed URL Options
    const options = {
        version: "v4" as const, // Use v4 signing, which is the current standard.
        action: "write" as const, // The URL grants permission to write (upload) a file.
        expires: Date.now() + 15 * 60 * 1000, // The URL will be valid for 15 minutes.
        contentType: contentType, // The file uploaded must match this content type.
    };

    // 5. Generate and Return the Signed URL
    try {
        const [url] = await file.getSignedUrl(options);
        console.log(`Generated signed URL for ${filePath}`);
        // Return the URL and the final path to the client. The client will need the path to store in the submission record.
        return { success: true, url: url, filePath: filePath };
    } catch (error: any) {
        console.error("Error creating signed URL:", error);
        throw new functions.https.HttpsError("internal", "Could not create upload URL. Please try again.", error.message);
    }
});
