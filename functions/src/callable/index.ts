import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

export const getSignedUploadUrl = onCall(async (request) => {
  const { fileName, contentType } = request.data;
  if (!fileName || !contentType) {
    throw new HttpsError('invalid-argument', 'The function must be called with "fileName" and "contentType".');
  }
  const bucket = getStorage().bucket();
  let filePath;
  let trackingToken;
  if (request.auth) {
    filePath = `submissions/${request.auth.uid}/${uuidv4()}-${fileName}`;
  } else {
    trackingToken = uuidv4();
    filePath = `music-uploads/temp/${trackingToken}/${uuidv4()}-${fileName}`;
  }
  const file = bucket.file(filePath);
  const options = {
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType: contentType,
    extensionHeaders: {
      'x-goog-meta-signed-url': 'true'
    }
  };
  try {
    const [url] = await file.getSignedUrl(options);
    return { url, filePath, trackingToken };
  } catch (error) {
    throw new HttpsError('internal', 'Failed to get signed URL.', error);
  }
});
