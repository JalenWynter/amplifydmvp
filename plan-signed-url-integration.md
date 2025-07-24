# Plan: Integrate Signed URL Uploads for Anonymous Submissions

## Goal
Enable secure, temporary uploads for anonymous users using signed URLs, and only move files to permanent storage after successful payment.

## Steps
1. **Frontend: Update Upload Logic**
   - Always request a signed URL from the backend before uploading music files as an anonymous user.
   - Upload the file to `/music-uploads/temp/...` using the signed URL.
   - Store the resulting file path or URL for use in payment metadata.

2. **Backend: Signed URL Function**
   - Ensure `getSignedUploadUrl` Cloud Function returns a signed URL for `/music-uploads/temp/...` for anonymous users.

3. **Stripe Checkout Integration**
   - Pass the uploaded file's path/URL as `audioUrl` in Stripe Checkout metadata.

4. **Backend: Stripe Webhook**
   - On successful payment, move the file from `/music-uploads/temp/...` to `/submissions/{userId}/...` (or another permanent location).
   - Create the Firestore submission record referencing the new file location.

5. **Cleanup**
   - Optionally, delete temp files if payment is not completed within a certain time.

6. **Testing**
   - Test the full flow: anonymous upload, payment, file move, and Firestore record creation.

## Notes
- This approach ensures only paid submissions are stored permanently and prevents abuse of storage by anonymous users. 