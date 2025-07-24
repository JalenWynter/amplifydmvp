import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// This function generates a file path for anonymous uploads using Firebase Storage rules
export const getSignedUploadUrl = functions.https.onCall(async (data: any, context: any) => {
    // 1. Input Validation: Ensure the necessary data (fileName, contentType) is provided.
    const { fileName, contentType } = data;
    if (!fileName || !contentType) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'fileName' and 'contentType'.");
    }

    // 2. Generate a unique file path for anonymous uploads
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const filePath = `submissions/anonymous/${timestamp}-${randomId}-${fileName}`;

    // 3. Get bucket name for direct upload URL
    const bucket = admin.storage().bucket();
    const bucketName = bucket.name;

    // 4. Create direct upload URL using Firebase Storage REST API
    // This approach uses Firebase Storage rules instead of signed URLs
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?uploadType=media`;

    console.log(`Generated upload path for anonymous user: ${filePath}`);
    
    // Return the file path and upload URL
    return { 
        success: true, 
        filePath: filePath,
        url: uploadUrl,
        contentType: contentType,
        message: "Upload directly to Firebase Storage using the provided URL"
    };
}); 