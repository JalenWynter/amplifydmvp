
import { z } from 'zod';

// =================================================================
// USER & AUTH TYPES
// =================================================================

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().url().optional(),
  role: z.enum(['uploader', 'reviewer', 'admin']),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']),
  joinedAt: z.string().datetime(),
  referredBy: z.string().optional(), // UID of the referrer
  referredByEmail: z.string().email().optional(), // Email of the referrer
  referralCode: z.string().optional(), // The code used to refer this user
});
export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserSchema>['role'];

export const ApplicationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  status: z.enum(['pending', 'approved', 'rejected']),
  submittedAt: z.string().datetime(),
  portfolioLink: z.string().url().optional(),
  referral: z.string().optional(),
  musicBackground: z.string().optional(),
  joinReason: z.string().optional(),
});
export type Application = z.infer<typeof ApplicationSchema>;

export const AppSettingsSchema = z.object({
  applicationMode: z.enum(['open', 'invite-only']),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const ActivityEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.string().datetime(),
  userEmail: z.string().email().optional(),
  details: z.record(z.string(), z.unknown()).optional(), // Loosely typed for now, can be refined
});
export type ActivityEvent = z.infer<typeof ActivityEventSchema>;

export const DashboardStatsSchema = z.object({
  totalUsers: z.number(),
  totalReviewers: z.number(),
  totalSubmissions: z.number(),
  completedReviews: z.number(),
});
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

export const FinancialStatsSchema = z.object({
  totalRevenue: z.number(),
  avgRevenuePerUser: z.number(),
  pendingPayouts: z.number(),
  pendingPayoutsCount: z.number(),
  totalUsers: z.number(),
});
export type FinancialStats = z.infer<typeof FinancialStatsSchema>;

export const TransactionStatsSchema = z.object({
  successfulTransactions: z.number(),
  totalTransactions: z.number(),
  conversionRate: z.number(),
  failedTransactions: z.number(),
});
export type TransactionStats = z.infer<typeof TransactionStatsSchema>;

export const PayoutSchema = z.object({
  id: z.string(),
  reviewerId: z.string(),
  reviewer: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    avatarUrl: z.string().url().optional(),
  }),
  amount: z.number(), // In dollars (for display)
  amountInCents: z.number().int().positive(), // For internal calculations
  status: z.enum(['Pending', 'Paid', 'Failed']),
  date: z.string().datetime(),
  paidDate: z.string().datetime().optional(),
  paymentMethod: z.string(),
  reviews: z.array(z.object({
    id: z.string(),
    artist: z.string(),
    song: z.string(),
    fee: z.number(),
    date: z.string().datetime(),
  })).default([]),
});
export type Payout = z.infer<typeof PayoutSchema>;

export const TransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['submission_payment', 'payout', 'referral_earning']),
  amount: z.number(), // In cents
  currency: z.string(),
  status: z.enum(['succeeded', 'failed', 'pending', 'completed', 'cancelled']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  description: z.string().optional(),
  relatedUserId: z.string().optional(),
  relatedSubmissionId: z.string().optional(),
  stripePaymentIntentId: z.string().optional(),
  stripeCheckoutSessionId: z.string().optional(),
  stripeSessionId: z.string().optional(),
  contactEmail: z.string().email().optional(),
  // Submission-related fields (for submission_payment type)
  artistName: z.string().optional(),
  songTitle: z.string().optional(),
  uploaderEmail: z.string().email().optional(),
  reviewerId: z.string().optional(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const ReferralCodeSchema = z.object({
  id: z.string(),
  code: z.string(),
  referrerId: z.string(),
  associatedUser: z.string(), // Email or Name of the referrer
  status: z.enum(['Active', 'Used', 'Expired']),
  createdAt: z.string().datetime(),
  usedAt: z.string().datetime().optional(),
  usedBy: z.string().optional(), // UID of the user who used it
  usedByEmail: z.string().email().optional(), // Email of the user who used it
});
export type ReferralCode = z.infer<typeof ReferralCodeSchema>;

export const ReferralEarningSchema = z.object({
  id: z.string(),
  referrerId: z.string(),
  referredUserId: z.string(),
  referredUserName: z.string(),
  referredUserEmail: z.string().email(),
  originalAmount: z.number(), // Amount earned by referred user (in cents)
  commissionAmount: z.number(), // Commission earned by referrer (in cents)
  createdAt: z.string().datetime(),
  status: z.enum(['pending', 'paid']),
});
export type ReferralEarning = z.infer<typeof ReferralEarningSchema>;

export const ReferralStatsSchema = z.object({
  totalReferrals: z.number().default(0),
  activeReferrals: z.number().default(0),
  totalEarnings: z.number().default(0), // In cents
  pendingEarnings: z.number().default(0), // In cents
  conversionRate: z.number().default(0),
});
export type ReferralStats = z.infer<typeof ReferralStatsSchema>;

export const UserTrackingDataSchema = z.object({
  userInfo: UserSchema.optional(),
  referrer: UserSchema.optional(),
  referralCode: ReferralCodeSchema.optional(),
  generatedCodes: z.array(ReferralCodeSchema).default([]),
  referredUsers: z.array(UserSchema).default([]),
  earningsReceived: z.array(ReferralEarningSchema).default([]),
});
export type UserTrackingData = z.infer<typeof UserTrackingDataSchema>;

// Reviewer type
export const ReviewerSchema = UserSchema.extend({
  bio: z.string().optional(),
  genres: z.array(z.string()).optional(),
  turnaround: z.string().optional(), // Use 'turnaround' everywhere
  turnaroundTime: z.number().optional(), // For legacy support
  experience: z.string().optional(),
  reviewRate: z.number().optional(),
  totalEarned: z.number().default(0),
  totalPaid: z.number().default(0),
  portfolioLinks: z.array(z.string().url()).optional(),
  manualPaymentInfo: z.string().optional(),
  packages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    priceInCents: z.number().int().positive(),
    description: z.string(),
    trackCount: z.number().int().positive(),
    formats: z.array(z.enum(['written', 'audio', 'video', 'chart'])),
  })).default([]),
});
export type Reviewer = z.infer<typeof ReviewerSchema>;

export const ReviewPackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceInCents: z.number().int().positive(),
  description: z.string(),
  trackCount: z.number().int().positive(),
  formats: z.array(z.enum(['written', 'audio', 'video', 'chart'])),
});
export type ReviewPackage = z.infer<typeof ReviewPackageSchema>;

export const ReviewSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  reviewerId: z.string(),
  scores: z.record(z.string(), z.number()),
  overallScore: z.number().min(1).max(10),
  strengths: z.string().min(50),
  improvements: z.string().min(50),
  summary: z.string().min(50),
  createdAt: z.string().datetime(),
  submissionDetails: z.object({
    artistName: z.string(),
    songTitle: z.string(),
  }),
});
export type Review = z.infer<typeof ReviewSchema>;

// =================================================================
// SUBMISSION & REVIEW TYPES
// =================================================================

export const SubmissionSchema = z.object({
  id: z.string(),
  uploaderId: z.string().optional(), // Optional for anonymous uploads
  uploaderEmail: z.string().email(),
  reviewerId: z.string(),
  packageId: z.string(), // ID of the selected review package
  songUrl: z.string().url(),
  artistName: z.string(),
  songTitle: z.string(),
  genre: z.string(),
  status: z.enum(['pending', 'in-progress', 'completed', 'rejected']),
  submittedAt: z.string().datetime(),
  reviewedAt: z.string().datetime().optional(),
  paymentIntentId: z.string(),
  stripeSessionId: z.string().optional(),
  amount: z.number().optional(), // Amount paid in cents
  currency: z.string().optional(), // Currency (e.g., 'usd')
  packageName: z.string().optional(), // Name of the review package
  packageDescription: z.string().optional(), // Description of the review package
  trackingToken: z.string(), // Unique token for anonymous tracking
  contactEmail: z.string().email(), // Add contactEmail
  audioUrl: z.string().url(), // Add audioUrl
});
export type Submission = z.infer<typeof SubmissionSchema>;

export const ReviewFormSchema = z.object({
  scores: z.record(z.string(), z.coerce.number().min(1).max(10)),
  overallScore: z.coerce.number().min(1).max(10),
  strengths: z.string().min(50, "Strengths must be at least 50 characters."),
  improvements: z.string().min(50, "Improvements must be at least 50 characters."),
  summary: z.string().min(50, "Summary must be at least 50 characters."),
  audioFeedbackUrl: z.string().optional(),
  videoFeedbackUrl: z.string().optional(),
  isDraft: z.boolean().optional(),
});
export type ReviewFormData = z.infer<typeof ReviewFormSchema>;

export const ProfileFormSchema = ReviewerSchema.pick({
  name: true,
  bio: true,
  genres: true,
  turnaroundTime: true,
  reviewRate: true,
  portfolioLinks: true,
  manualPaymentInfo: true,
});
export type ProfileFormData = z.infer<typeof ProfileFormSchema>;

export type ReviewFormValues = z.infer<typeof ReviewFormSchema>;
