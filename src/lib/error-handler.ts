// This file would contain a centralized error handling utility.
// A structured approach to error handling is crucial for stability and debugging.

interface HandledError {
  message: string;
  statusCode?: number;
  originalError?: any;
}

/**
 * Logs an error to the console and potentially to a monitoring service.
 * @param error - The error object or message.
 * @param context - Additional context about where the error occurred.
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  console.error("Amplifyd Error:", {
    error,
    context,
    timestamp: new Date().toISOString(),
  });

  // In a production environment, you would also send this to a monitoring service
  // like Sentry, LogRocket, or Google Cloud Logging.
  // e.g., Sentry.captureException(error, { extra: context });
}

/**
 * Normalizes an error into a consistent format for API responses or UI display.
 * @param error - The error to handle.
 * @returns A structured error object.
 */
export function handleApiError(error: any): HandledError {
  logError(error);

  if (error.isJoi || error.name === 'ZodError') {
    return {
      message: 'Validation failed.',
      statusCode: 400,
      originalError: error.errors,
    };
  }

  // Add more specific error type handling here

  return {
    message: 'An unexpected error occurred.',
    statusCode: 500,
  };
}
