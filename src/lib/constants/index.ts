/**
 * Central export for all application constants
 */

export * from './statuses';

export const REFERRAL_CODE_STATUS = {
  ACTIVE: 'Active',
  USED: 'Used',
  EXPIRED: 'Expired',
} as const;

export const REFERRAL_EARNING_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
} as const;

export const APPLICATION_MODE = {
  OPEN: 'open',
  INVITE_ONLY: 'invite-only',
} as const;

export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  REVIEWED: 'reviewed',
} as const;

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// Other constants files will be added here as we create them
// export * from './genres';
// export * from './validation';
// export * from './firebase'; 