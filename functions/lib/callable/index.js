import * as functions from 'firebase-functions';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';
export const getSignedUploadUrl = functions.https.onCall(async (data, context) => {
    const fileName = data.fileName;
    const contentType = data.contentType;
    if (!fileName || !contentType) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with "fileName" and "contentType".');
    }
    const bucket = getStorage().bucket();
    let filePath;
    let trackingToken;
    if (context.auth) {
        // Authenticated user upload
        filePath = `submissions/${context.auth.uid}/${uuidv4()}-${fileName}`;
    }
    else {
        // Anonymous user upload via temporary path
        trackingToken = uuidv4();
        filePath = `music-uploads/temp/${trackingToken}/${uuidv4()}-${fileName}`;
    }
    const file = bucket.file(filePath);
    const options = {
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000,
        contentType: contentType,
        // Add metadata to indicate it's a signed URL upload for Storage rules
        extensionHeaders: {
            'x-goog-meta-signed-url': 'true'
        }
    };
    try {
        // Get a v4 signed URL for uploading file
        const [url] = await file.getSignedUrl(options);
        return { url, filePath, trackingToken };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Failed to get signed URL.', error);
    }
});
//# sourceMappingURL=index.js.map