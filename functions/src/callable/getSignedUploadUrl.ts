import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const getSignedUploadUrl = onCall(async (request) => {
    const { fileName, contentType } = request.data;
    if (!fileName || !contentType) {
        throw new HttpsError('invalid-argument', "The function must be called with a 'fileName' and 'contentType'.");
    }
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const filePath = `music-uploads/temp/${timestamp}-${randomId}-${fileName}`;
    const bucket = admin.storage().bucket();
    const bucketName = bucket.name;
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?uploadType=media`;
    console.log(`Generated upload path for anonymous user: ${filePath}`);
    return {
        success: true,
        filePath: filePath,
        url: uploadUrl,
        contentType: contentType,
        message: 'Upload directly to Firebase Storage using the provided URL',
    };
}); 