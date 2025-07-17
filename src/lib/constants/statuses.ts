/**
 * Application-wide status constants
 * These constants prevent hardcoded status strings throughout the codebase
 * and provide a single source of truth for all status values.
 */

// User Roles
export const USER_ROLE = {
  ADMIN: 'Admin',
  REVIEWER: 'Reviewer',
  ARTIST: 'Artist'
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

// User Status
export const USER_STATUS = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  BANNED: 'Banned'
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

// Application Status
export const APPLICATION_STATUS = {
  PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_MORE_INFO: 'Needs More Info'
} as const;

export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];

// Submission Status
export const SUBMISSION_STATUS = {
  PENDING_REVIEW: 'Pending Review',
  IN_PROGRESS: 'In Progress',
  REVIEWED: 'Reviewed'
} as const;

export type SubmissionStatus = typeof SUBMISSION_STATUS[keyof typeof SUBMISSION_STATUS];

// Referral Code Status
export const REFERRAL_CODE_STATUS = {
  ACTIVE: 'Active',
  USED: 'Used',
  EXPIRED: 'Expired'
} as const;

export type ReferralCodeStatus = typeof REFERRAL_CODE_STATUS[keyof typeof REFERRAL_CODE_STATUS];

// Payout Status
export const PAYOUT_STATUS = {
  PENDING: 'Pending',
  IN_TRANSIT: 'In-Transit',
  PAID: 'Paid'
} as const;

export type PayoutStatus = typeof PAYOUT_STATUS[keyof typeof PAYOUT_STATUS];

// Transaction Status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

export type TransactionStatus = typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS];

// Referral Earning Status
export const REFERRAL_EARNING_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled'
} as const;

export type ReferralEarningStatus = typeof REFERRAL_EARNING_STATUS[keyof typeof REFERRAL_EARNING_STATUS];

// Application Mode
export const APPLICATION_MODE = {
  INVITE_ONLY: 'invite-only',
  OPEN: 'open'
} as const;

export type ApplicationMode = typeof APPLICATION_MODE[keyof typeof APPLICATION_MODE];

// Default values
export const DEFAULTS = {
  USER_ROLE: USER_ROLE.REVIEWER,
  USER_STATUS: USER_STATUS.ACTIVE,
  APPLICATION_STATUS: APPLICATION_STATUS.PENDING_REVIEW,
  SUBMISSION_STATUS: SUBMISSION_STATUS.PENDING_REVIEW,
  REFERRAL_CODE_STATUS: REFERRAL_CODE_STATUS.ACTIVE,
  PAYOUT_STATUS: PAYOUT_STATUS.PENDING,
  TRANSACTION_STATUS: TRANSACTION_STATUS.PENDING,
  APPLICATION_MODE: APPLICATION_MODE.INVITE_ONLY
} as const; 