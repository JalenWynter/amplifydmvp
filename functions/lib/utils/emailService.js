"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaymentConfirmation = exports.sendSubmissionNotification = exports.sendReviewCompleteEmail = exports.generateSecureToken = void 0;
const crypto = __importStar(require("crypto"));
// Generate secure access token for review links
const generateSecureToken = () => {
    return crypto.randomBytes(32).toString('hex');
};
exports.generateSecureToken = generateSecureToken;
// Send review completion email to artist
const sendReviewCompleteEmail = async (email, artistName, reviewId, accessToken) => {
    const reviewUrl = `https://amplifydmvp.web.app/review/${reviewId}?token=${accessToken}`;
    // For now, log the email (replace with actual email service)
    console.log(`📧 Review Complete Email to ${email}:`);
    console.log(`Artist: ${artistName}`);
    console.log(`Review URL: ${reviewUrl}`);
    // TODO: Integrate with SendGrid/Postmark
    // await sendEmail(email, 'Your Review is Ready!', emailTemplate);
};
exports.sendReviewCompleteEmail = sendReviewCompleteEmail;
// Send submission notification to reviewer
const sendSubmissionNotification = async (reviewerEmail, artistName, songTitle) => {
    console.log(`📧 New Submission Notification to ${reviewerEmail}:`);
    console.log(`Artist: ${artistName}`);
    console.log(`Song: ${songTitle}`);
    // TODO: Integrate with SendGrid/Postmark
    // await sendEmail(reviewerEmail, 'New Submission Available', emailTemplate);
};
exports.sendSubmissionNotification = sendSubmissionNotification;
// Send payment confirmation to artist
const sendPaymentConfirmation = async (email, artistName, songTitle, amount) => {
    console.log(`📧 Payment Confirmation to ${email}:`);
    console.log(`Artist: ${artistName}`);
    console.log(`Song: ${songTitle}`);
    console.log(`Amount: $${amount}`);
    // TODO: Integrate with SendGrid/Postmark
    // await sendEmail(email, 'Payment Confirmed - Review in Progress', emailTemplate);
};
exports.sendPaymentConfirmation = sendPaymentConfirmation;
//# sourceMappingURL=emailService.js.map