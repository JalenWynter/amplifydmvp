import * as z from 'zod';

// This file contains Zod schemas for validating data throughout the application.
// Using schemas ensures data integrity both on the client and server.

// Schema for anonymous music submission
export const submissionSchema = z.object({
  artistName: z.string().min(2, { message: "Artist name must be at least 2 characters." }),
  songTitle: z.string().min(2, { message: "Song title must be at least 2 characters." }),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }),
  // File validation is typically handled separately, often on the server.
  musicFile: z.any(),
});


// Schema for reviewer application
export const reviewerApplicationSchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  primaryRole: z.string().min(1, "Please select your primary role."),
  experience: z.string().min(50, "Please describe your experience in at least 50 characters."),
  portfolioLink: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

// Schema for user login
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
