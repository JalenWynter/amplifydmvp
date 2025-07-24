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
