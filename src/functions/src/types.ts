// Local type definitions for Cloud Functions
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'uploader' | 'reviewer' | 'admin';
  status: 'pending' | 'active' | 'inactive' | 'suspended';
  joinedAt: string;
  avatarUrl?: string;
  referredBy?: string;
  referredByEmail?: string;
  referralCode?: string;
}

export interface Application {
  id: string;
  name: string;
  email: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  musicBackground?: string;
}

export interface Reviewer {
  id: string;
  name: string;
  email: string;
  role: 'reviewer';
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: string;
  reviewRate: number;
  totalEarned: number;
  totalReviews: number;
  averageRating: number;
  bio?: string;
  avatarUrl?: string;
  genres?: string[];
  experience?: string;
  paymentInfo?: string;
  manualPaymentInfo?: string;
}

export interface Submission {
  id: string;
  artistName: string;
  songTitle: string;
  contactEmail: string;
  musicFileUrl: string;
  reviewerId?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  submittedAt: string;
  completedAt?: string;
  trackingToken?: string;
  uploaderEmail?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  stripeSessionId?: string;
  packageId?: string;
}

export interface Review {
  id: string;
  submissionId: string;
  reviewerId: string;
  scores: Record<string, number>;
  overallScore: number;
  strengths: string;
  improvements: string;
  summary: string;
  createdAt: string;
  submissionDetails?: {
    artistName: string;
    songTitle: string;
    contactEmail: string;
  };
}

// Constants
export const USER_ROLE = {
  UPLOADER: 'uploader' as const,
  REVIEWER: 'reviewer' as const,
  ADMIN: 'admin' as const,
};

export const USER_STATUS = {
  PENDING: 'pending' as const,
  ACTIVE: 'active' as const,
  INACTIVE: 'inactive' as const,
  SUSPENDED: 'suspended' as const,
};

export const APPLICATION_STATUS = {
  PENDING: 'pending' as const,
  APPROVED: 'approved' as const,
  REJECTED: 'rejected' as const,
};

export const SUBMISSION_STATUS = {
  PENDING: 'pending' as const,
  IN_PROGRESS: 'in-progress' as const,
  COMPLETED: 'completed' as const,
  REJECTED: 'rejected' as const,
  REVIEWED: 'completed' as const, // Alias for compatibility
}; 