import * as crypto from 'crypto';

// Generate secure access token for review links
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Send review completion email to artist
export const sendReviewCompleteEmail = async (
  email: string, 
  artistName: string, 
  reviewId: string, 
  accessToken: string
) => {
  const reviewUrl = `https://amplifydmvp.web.app/review/${reviewId}?token=${accessToken}`;
  
  // For now, log the email (replace with actual email service)
  console.log(`📧 Review Complete Email to ${email}:`);
  console.log(`Artist: ${artistName}`);
  console.log(`Review URL: ${reviewUrl}`);
  
  // TODO: Integrate with SendGrid/Postmark
  // await sendEmail(email, 'Your Review is Ready!', emailTemplate);
};

// Send submission notification to reviewer
export const sendSubmissionNotification = async (
  reviewerEmail: string,
  artistName: string,
  songTitle: string
) => {
  console.log(`📧 New Submission Notification to ${reviewerEmail}:`);
  console.log(`Artist: ${artistName}`);
  console.log(`Song: ${songTitle}`);
  
  // TODO: Integrate with SendGrid/Postmark
  // await sendEmail(reviewerEmail, 'New Submission Available', emailTemplate);
};

// Send payment confirmation to artist
export const sendPaymentConfirmation = async (
  email: string,
  artistName: string,
  songTitle: string,
  amount: number
) => {
  console.log(`📧 Payment Confirmation to ${email}:`);
  console.log(`Artist: ${artistName}`);
  console.log(`Song: ${songTitle}`);
  console.log(`Amount: $${amount}`);
  
  // TODO: Integrate with SendGrid/Postmark
  // await sendEmail(email, 'Payment Confirmed - Review in Progress', emailTemplate);
};
