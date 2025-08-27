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

// Re-export all types from the main types file
export * from '../types';

// Additional types for admin functionality
export interface ReviewFormValues {
  summary: string;
  scores: Record<string, number>;
  overallScore: number;
  strengths: string;
  improvements: string;
}

export interface ProfileFormData {
  name: string;
  bio: string;
  genres: string[];
  turnaround: string;
  experience: string;
}
