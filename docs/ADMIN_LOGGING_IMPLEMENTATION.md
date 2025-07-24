# Admin Dashboard: Real-time API & Server Logging Implementation Plan

This document outlines the steps to implement a robust, production-ready solution for fetching and displaying real API and server logs from Google Cloud Logging within the Admin Dashboard's `src/app/admin/api-logs/page.tsx`.

## 1. Overview

Firebase Functions automatically send their logs to Google Cloud Logging. To securely access these logs from the frontend, we will implement a new Firebase Callable Function. This function will act as a secure proxy, querying Google Cloud Logging and returning sanitized, relevant log data to the frontend.

## 2. Backend Implementation: Firebase Callable Function (`getApiLogsCallable`)

### 2.1. Function Purpose
A new Firebase Callable Function will be created to:
- Authenticate securely with Google Cloud Logging.
- Query logs from Firebase Functions and other relevant Google Cloud services.
- Filter logs based on criteria (e.g., time range, log level, search terms).
- Sanitize log data to remove sensitive information.
- Return a structured, paginated list of log entries.

### 2.2. Prerequisites
- **Google Cloud Project Permissions:** The Firebase service account associated with your Firebase project must have the `roles/logging.viewer` permission to read logs from Google Cloud Logging. This is usually set up by default for Firebase projects, but verify if issues arise.
- **Firebase Admin SDK:** Ensure your Firebase Functions project has the Firebase Admin SDK initialized.

### 2.3. Implementation Steps

#### a. Install Dependencies (in `functions` directory)
```bash
npm install @google-cloud/logging
```

#### b. Create the Callable Function File
Create a new file, e.g., `functions/src/callable/getApiLogs.ts`.

#### c. Implement `getApiLogsCallable`
```typescript
import * as functions from 'firebase-functions';
import { Logging } from '@google-cloud/logging';
import { getAuth } from 'firebase-admin/auth';

const logging = new Logging();
const logName = 'projects/YOUR_GCP_PROJECT_ID/logs/cloudfunctions.googleapis.com%2Fcloud-functions'; // Adjust as needed for other log sources

export const getApiLogsCallable = functions.https.onCall(async (data, context) => {
    // 1. Authentication and Authorization
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const userId = context.auth.uid;
    const userRecord = await getAuth().getUser(userId);

    // Ensure only admins can access this function
    if (userRecord.customClaims?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only administrators can access API logs.');
    }

    // 2. Input Validation (Optional but Recommended)
    const { pageSize = 50, pageToken, filter = '' } = data; // Example: pageSize, pageToken for pagination, filter for search

    // 3. Construct Log Query
    let query = `resource.type="cloud_function"`; // Filter for Cloud Function logs
    if (filter) {
        // Example: search for message content or specific fields
        query += ` AND (textPayload:"${filter}" OR jsonPayload.message:"${filter}" OR jsonPayload.error:"${filter}")`;
    }
    // Add more filters as needed, e.g., by severity, time range
    // query += ` AND severity=ERROR`;
    // query += ` AND timestamp>="${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"`; // Last 24 hours

    const options: any = {
        pageSize: pageSize,
        orderBy: 'timestamp desc', // Newest first
        filter: query,
    };

    if (pageToken) {
        options.pageToken = pageToken;
    }

    // 4. Fetch Logs from Google Cloud Logging
    let entries;
    let nextQueryToken;
    try {
        [entries, nextQueryToken] = await logging.log(logName).getEntries(options);
    } catch (error) {
        console.error('Error fetching logs from Google Cloud Logging:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch logs from logging service.', error);
    }

    // 5. Process and Sanitize Logs
    const processedLogs = entries.map(entry => {
        const { timestamp, severity, textPayload, jsonPayload } = entry;

        // Extract relevant message and metadata
        let message = textPayload || (jsonPayload && (jsonPayload.message || jsonPayload.error)) || 'No message';
        let metadata: any = {};

        // Example: Extract specific metadata for Stripe webhooks or other events
        if (jsonPayload && jsonPayload.event === 'stripe.webhook.received') {
            message = `Stripe Webhook Received: ${jsonPayload.type}`;
            metadata = {
                stripeEventId: jsonPayload.id,
                stripeEventType: jsonPayload.type,
                // DO NOT include full event data or sensitive info
            };
        } else if (jsonPayload && jsonPayload.functionName) {
            // Example for general function logs
            metadata = {
                function: jsonPayload.functionName,
                // Add other relevant, non-sensitive fields
            };
        }

        // Sanitize message and metadata to remove sensitive data
        // Implement robust sanitization logic here.
        // Example: Replace API keys, sensitive IDs, etc. with masked versions or remove entirely.
        message = message.replace(/sk_test_[a-zA-Z0-9]+/g, 'sk_test_***'); // Example: mask Stripe secret keys

        return {
            timestamp: timestamp ? new Date(timestamp.seconds * 1000).toISOString() : new Date().toISOString(),
            level: severity || 'INFO',
            message: message,
            metadata: metadata,
        };
    });

    // 6. Return Logs and Next Page Token
    return {
        logs: processedLogs,
        nextPageToken: nextQueryToken || null,
    };
});
```
**Important:** Replace `YOUR_GCP_PROJECT_ID` with your actual Google Cloud Project ID. You can find this in your Firebase project settings or Google Cloud Console.

#### d. Export the Function
Ensure the new callable function is exported in your `functions/src/index.ts` file:
```typescript
export { getApiLogsCallable } from './callable/getApiLogs';
// ... other exports
```

#### e. Deploy the Function
```bash
firebase deploy --only functions
```

## 3. Frontend Integration: `src/lib/firebase/admin/api-logs.ts`

The `getApiLogs` function in your frontend will now call this new Firebase Callable Function.

### 3.1. Update `src/lib/firebase/admin/api-logs.ts`
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

// Define the type for a log entry as expected by the frontend
export interface ApiLogEntry {
    timestamp: string;
    level: string;
    message: string;
    metadata?: Record<string, any>;
}

// Define the response type from the callable function
interface GetApiLogsResponse {
    logs: ApiLogEntry[];
    nextPageToken: string | null;
}

export async function getApiLogs(
    filter?: string,
    pageSize?: number,
    pageToken?: string
): Promise<ApiLogEntry[]> {
    const functions = getFunctions(getApp());
    const getApiLogsFn = httpsCallable<
        { filter?: string; pageSize?: number; pageToken?: string },
        GetApiLogsResponse
    >(functions, 'getApiLogsCallable'); // 'getApiLogsCallable' matches the deployed function name

    try {
        const result = await getApiLogsFn({ filter, pageSize, pageToken });
        // You might want to store result.data.nextPageToken for pagination in the UI
        return result.data.logs;
    } catch (error) {
        console.error('Error calling getApiLogsCallable:', error);
        // Handle error appropriately in your UI
        return [];
    }
}
```

## 4. Frontend UI (`src/app/admin/api-logs/page.tsx`)

The existing UI code in `src/app/admin/api-logs/page.tsx` should largely work as is, as it expects an array of `ApiLogEntry`. You might want to enhance it to:
- Pass `filter`, `pageSize`, and `pageToken` to `getApiLogs`.
- Implement pagination using the `nextPageToken` returned by the callable function.
- Add more sophisticated filtering options (e.g., by date range, log level).

## 5. Production Considerations

-   **Security:** Ensure the callable function has robust authentication and authorization checks (e.g., only admin users can call it).
-   **Performance:** For very large log volumes, implement efficient pagination and filtering on the backend.
-   **Cost:** Be mindful of Google Cloud Logging API quotas and costs, especially with frequent or broad queries.
-   **Error Handling:** Implement comprehensive error handling on both frontend and backend.
-   **Log Retention:** Configure log retention policies in Google Cloud Logging to manage storage.
-   **Sensitive Data:** Reiterate and ensure that no sensitive data (API keys, PII, full payment details) is ever logged or returned to the frontend. Implement strict sanitization.

This plan provides a clear path to integrating real-time API logs. Let me know when you're ready to start implementing the Firebase Callable Function, or if you have any questions about this plan.
