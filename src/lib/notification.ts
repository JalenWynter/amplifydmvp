// Notification service for sending emails and notifications

export interface NotificationData {
  to: string;
  subject: string;
  message: string;
  type: 'submission' | 'review_complete' | 'application_status' | 'general';
  metadata?: {
    submissionId?: string;
    reviewId?: string;
    reviewUrl?: string;
    artistName?: string;
    songTitle?: string;
    reviewerName?: string;
  };
}

export interface NotificationResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Send notification email
 * For now, this logs to console but can be extended to use SendGrid, Postmark, etc.
 */
export async function sendNotification(data: NotificationData): Promise<NotificationResult> {
  console.log('📧 NOTIFICATION SENT:', {
    to: data.to,
    subject: data.subject,
    type: data.type,
    metadata: data.metadata,
    timestamp: new Date().toISOString(),
  });
  
  // Log the email content
  console.log('📝 EMAIL CONTENT:');
  console.log(`To: ${data.to}`);
  console.log(`Subject: ${data.subject}`);
  console.log(`Message: ${data.message}`);
  console.log('---');
  
  // TODO: Implement actual email sending with SendGrid, Postmark, etc.
  // For now, simulate success
  return {
    success: true,
    messageId: `msg_${Date.now()}`,
  };
}

/**
 * Send notification when new submission is received
 */
export async function notifyNewSubmission(data: {
  reviewerEmail: string;
  reviewerName: string;
  artistName: string;
  songTitle: string;
  submissionId: string;
  dashboardUrl: string;
}): Promise<NotificationResult> {
  const notification: NotificationData = {
    to: data.reviewerEmail,
    subject: `New Track Submission - ${data.songTitle} by ${data.artistName}`,
    message: `
Hi ${data.reviewerName},

You have a new track submission waiting for review:

🎵 Track: "${data.songTitle}"
🎤 Artist: ${data.artistName}
📝 Submission ID: ${data.submissionId}

You can start your review by logging into your dashboard:
${data.dashboardUrl}

Thank you for being part of the Amplifyd community!

Best regards,
The Amplifyd Team
    `,
    type: 'submission',
    metadata: {
      submissionId: data.submissionId,
      artistName: data.artistName,
      songTitle: data.songTitle,
      reviewerName: data.reviewerName,
    },
  };
  
  return await sendNotification(notification);
}

/**
 * Send notification when review is completed
 */
export async function notifyReviewComplete(data: {
  artistEmail: string;
  artistName: string;
  songTitle: string;
  reviewId: string;
  reviewUrl: string;
  reviewerName: string;
  overallScore: number;
}): Promise<NotificationResult> {
  const notification: NotificationData = {
    to: data.artistEmail,
    subject: `Your Review is Complete - ${data.songTitle}`,
    message: `
Hi ${data.artistName},

Great news! Your track review is now complete.

🎵 Track: "${data.songTitle}"
⭐ Overall Score: ${data.overallScore.toFixed(1)}/10
👨‍🎤 Reviewed by: ${data.reviewerName}

You can view your complete review with detailed feedback, scores, and recommendations at:
${data.reviewUrl}

This link is secure and personal to you. You can access it anytime to review the feedback.

Thank you for trusting Amplifyd with your music!

Best regards,
The Amplifyd Team
    `,
    type: 'review_complete',
    metadata: {
      reviewId: data.reviewId,
      reviewUrl: data.reviewUrl,
      artistName: data.artistName,
      songTitle: data.songTitle,
      reviewerName: data.reviewerName,
    },
  };
  
  return await sendNotification(notification);
}

/**
 * Send notification to admin when new submission is received
 */
export async function notifyAdminNewSubmission(data: {
  adminEmail: string;
  artistName: string;
  songTitle: string;
  submissionId: string;
  reviewerName: string;
  adminDashboardUrl: string;
}): Promise<NotificationResult> {
  const notification: NotificationData = {
    to: data.adminEmail,
    subject: `New Submission Alert - ${data.songTitle}`,
    message: `
Admin Alert: New submission received

🎵 Track: "${data.songTitle}"
🎤 Artist: ${data.artistName}
👨‍🎤 Assigned to: ${data.reviewerName}
📝 Submission ID: ${data.submissionId}

View in admin dashboard:
${data.adminDashboardUrl}

Track the submission progress and ensure timely review completion.
    `,
    type: 'submission',
    metadata: {
      submissionId: data.submissionId,
      artistName: data.artistName,
      songTitle: data.songTitle,
      reviewerName: data.reviewerName,
    },
  };
  
  return await sendNotification(notification);
}

/**
 * Send notification to admin when review is completed
 */
export async function notifyAdminReviewComplete(data: {
  adminEmail: string;
  artistName: string;
  songTitle: string;
  reviewId: string;
  reviewerName: string;
  overallScore: number;
  adminDashboardUrl: string;
}): Promise<NotificationResult> {
  const notification: NotificationData = {
    to: data.adminEmail,
    subject: `Review Completed - ${data.songTitle}`,
    message: `
Admin Alert: Review completed

🎵 Track: "${data.songTitle}"
🎤 Artist: ${data.artistName}
👨‍🎤 Reviewed by: ${data.reviewerName}
⭐ Score: ${data.overallScore.toFixed(1)}/10

View details in admin dashboard:
${data.adminDashboardUrl}

Artist has been notified and can now view their review.
    `,
    type: 'review_complete',
    metadata: {
      reviewId: data.reviewId,
      artistName: data.artistName,
      songTitle: data.songTitle,
      reviewerName: data.reviewerName,
    },
  };
  
  return await sendNotification(notification);
} 