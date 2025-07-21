/**
 * Central type definitions for the Amplifyd application
 * All data structures and interfaces are defined here
 */

import { 
  UserRole, 
  UserStatus, 
  ApplicationStatus, 
  SubmissionStatus, 
  ReferralCodeStatus, 
  PayoutStatus, 
  TransactionStatus,
  ReferralEarningStatus,
  ApplicationMode 
} from '../constants';

// App Settings
export interface AppSettings {
  applicationMode: ApplicationMode;
}

// Review Package
export interface ReviewPackage {
  id: string;
  name: string;
  priceInCents: number;
  description: string;
  trackCount: number;
  formats: ('chart' | 'written' | 'audio' | 'video')[];
}

// Reviewer
export interface Reviewer {
  id: string;
  name: string;
  genres: string[];
  turnaround: string;
  experience: string;
  avatarUrl: string;
  dataAiHint?: string;
  packages: ReviewPackage[];
}

// User
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string; // ISO String
  avatarUrl?: string;
  referredBy?: string; // User ID who referred this user
  referredByEmail?: string; // Email of the referrer
  referralCode?: string; // The referral code used by this user
}

// Transaction
export interface Transaction {
  id?: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  artistName: string;
  songTitle: string;
  contactEmail: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  reviewerId: string;
  packageId: string;
  submissionId?: string;
  failureReason?: string;
  stripeError?: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

// Application
export interface Application {
  id: string;
  name: string;
  email: string;
  status: ApplicationStatus;
  primaryRole: string;
  portfolioLink: string;
  musicBackground: string;
  joinReason: string;
  referral: string;
  submittedAt: string;
  userId: string | null;
}

// Payout Review
export interface PayoutReview {
  id: string;
  artist: string;
  song: string;
  date: string;
  fee: number;
}

// Payout
export interface Payout {
  id: string;
  reviewer: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
  };
  amountInCents: number;
  status: PayoutStatus;
  date: string; // Request date
  paidDate?: string; // Paid date
  paymentMethod: string;
  reviews: PayoutReview[];
}

// Submission
export interface Submission {
  id: string;
  artistName: string;
  songTitle: string;
  genre: string;
  contactEmail: string;
  status: SubmissionStatus;
  submittedAt: string;
  audioUrl: string;
  reviewerId: string;
  packageId: string;
}

// Review
export interface Review {
  id: string;
  submissionId: string;
  reviewerId: string;
  scores: { [key: string]: number };
  overallScore: number;
  strengths: string;
  improvements: string;
  summary: string;
  createdAt: string;
  audioFeedbackUrl?: string;
  videoFeedbackUrl?: string;
  // Added for display on the reviews list page
  submissionDetails: {
    artistName: string;
    songTitle: string;
  };
}

// Referral Code
export interface ReferralCode {
  id: string;
  code: string;
  associatedUser: string;
  status: ReferralCodeStatus;
  createdAt: string; // ISO String
  referrerId?: string; // User ID who referred this user
  usedBy?: string; // User ID who used this code
  usedByEmail?: string; // Email of the user who used this code
  usedAt?: string; // ISO String when code was used
}

// Referral Earning
export interface ReferralEarning {
  id: string;
  referrerId: string; // User ID who made the referral
  referredUserId: string; // User ID who was referred
  referredUserName?: string; // Name of the referred user
  referredUserEmail?: string; // Email of the referred user
  submissionId: string; // Submission that generated the earning
  reviewId: string; // Review that generated the earning
  commissionAmount: number; // Amount earned in cents
  commissionRate: number; // Rate as decimal (e.g., 0.07 for 7%)
  originalAmount: number; // Original review amount in cents
  status: ReferralEarningStatus;
  createdAt: string; // ISO String
  paidAt?: string; // ISO String when paid
}

// Referral Stats
export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number; // in cents
  pendingEarnings: number; // in cents
  paidEarnings: number; // in cents
  conversionRate: number; // percentage
}

// Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  totalReviewers: number;
  totalSubmissions: number;
  completedReviews: number;
}

// Financial Stats
export interface FinancialStats {
  totalRevenue: number;
  avgRevenuePerUser: number;
  pendingPayouts: number;
  pendingPayoutsCount: number;
  totalUsers: number;
}

// Reviewer Earnings
export interface ReviewerEarnings {
  totalEarnings: number;
  completedReviews: number;
  pendingEarnings: number;
  averageEarningPerReview: number;
  referralEarnings: number;
  totalEarningsWithReferrals: number;
}

// Activity Event
export interface ActivityEvent {
  id?: string; // Firestore document ID
  timestamp: string; // ISO String
  type: string; // e.g., 'application_approved', 'review_submitted', 'user_created'
  userId?: string; // User ID who performed the action (if applicable)
  userEmail?: string; // User email who performed the action (if applicable)
  details: { [key: string]: unknown }; // Event-specific data
}

// User Tracking Data for Referral System
export interface UserTrackingData {
  userInfo: User | null;
  referrer: User | null;
  referralCode?: ReferralCode | null;
  generatedCodes: ReferralCode[];
  referredUsers: User[];
  earningsReceived: ReferralEarning[];
}
