// Re-export all Firebase services for easy importing
export { addApplication, getApplications, getApplicationById, rejectApplication } from './applications';
export { uploadMusicFile, getSubmissions, getSubmissionById, getSubmissionStatusByToken, getSubmissionsForAdmin, updateSubmissionStatus, assignReviewerToSubmission, getSubmissionsForReviewer } from './submissions';
export { getUsers, getCurrentUserInfo, approveApplication } from './users';
export { getReviewers } from './reviewers';
export { submitReview, submitReviewAsAdmin, getReviewsByReviewer } from './reviews';
export { createTransaction, getTransactions, getTransactionStats, getTransactionBySessionId, updateTransactionStatus } from './transactions';
export { getReferralEarnings, getUserReferralHistory, createReferralCode, getCodesCreatedToday, getReferralStats, getReferralCodes, getAllReferralCodes, getReferralTrackingChain } from './referrals';
export { getPayouts, getPayoutById, createPayout, updatePayoutStatus } from './payouts';
export { logActivityEvent, getRecentActivityEvents } from './activity';
export { getAppSettings, updateAppSettings } from './appSettings';

// From admin/users.ts
export { updateUserRole, updateUserStatus } from './admin/users';

// Re-export types for convenience
export type { 
  User, 
  UserRole, 
  Reviewer, 
  ReviewPackage, 
  Review, 
  Submission, 
  Application, 
  AppSettings,
  Transaction,
  ReferralCode,
  ReferralEarning,
  ReferralStats,
  Payout,
  ReviewFormData,
  ProfileFormData
} from '../types';