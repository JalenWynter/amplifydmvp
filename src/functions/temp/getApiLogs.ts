import * as functions from 'firebase-functions';
import { Logging, LogEntry } from '@google-cloud/logging';
import { getAuth } from 'firebase-admin/auth';

const logging = new Logging();
const logName = 'projects/YOUR_GCP_PROJECT_ID/logs/cloudfunctions.googleapis.com%2Fcloud-functions'; // Adjust as needed for other log sources

interface GetApiLogsData {
    pageSize?: number;
    pageToken?: string;
    filter?: string;
}

export const getApiLogsCallable = functions.https.onCall(async (data: GetApiLogsData, context) => {
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
    const { pageSize = 50, pageToken, filter = '' } = data;

    // 3. Construct Log Query
    let query = `resource.type="cloud_function"`;
    if (filter) {
        query += ` AND (textPayload:"${filter}" OR jsonPayload.message:"${filter}" OR jsonPayload.error:"${filter}")`;
    }

    const options: any = {
        pageSize: pageSize,
        orderBy: 'timestamp desc',
        filter: query,
    };

    if (pageToken) {
        options.pageToken = pageToken;
    }

    // 4. Fetch Logs from Google Cloud Logging
    let entries: LogEntry[];
    let nextQueryToken: string | undefined;
    try {
        [entries, nextQueryToken] = await logging.log(logName).getEntries(options);
    } catch (error) {
        console.error('Error fetching logs from Google Cloud Logging:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch logs from logging service.', error);
    }

    // 5. Process and Sanitize Logs
    const processedLogs = entries.map((entry: LogEntry) => {
        const { timestamp, severity, textPayload, jsonPayload } = entry;

        let message = textPayload || (jsonPayload && (jsonPayload.message || jsonPayload.message)) || 'No message';
        let metadata: any = {};

        if (jsonPayload && (jsonPayload as any).event === 'stripe.webhook.received') {
            message = `Stripe Webhook Received: ${(jsonPayload as any).type}`;
            metadata = {
                stripeEventId: (jsonPayload as any).id,
                stripeEventType: (jsonPayload as any).type,
            };
        } else if (jsonPayload && (jsonPayload as any).functionName) {
            metadata = {
                function: (jsonPayload as any).functionName,
            };
        }

        message = message.replace(/sk_test_[a-zA-Z0-9]+/g, 'sk_test_***');

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
