# Amplifyd Development & Testing Guide

## Overview
This guide ensures production-ready development with proper Firebase emulator setup, data seeding, and comprehensive testing protocols. All code must be production-ready with no shortcuts or mock data unless explicitly specified.

**Amplifyd** is a professional music review platform connecting independent artists with experienced reviewers, providing detailed feedback through multiple formats with sophisticated scoring and referral-based growth.

## Core Architecture Principles

### 1. Type Safety & Validation
- **All data must be validated using Zod schemas** before processing
- **Strict TypeScript enforcement** across frontend and backend
- **No `any` types** - use proper type definitions
- **Runtime validation** for all external data sources

### 2. Firebase Integration Patterns
- **Client-side operations**: Direct Firestore calls for read operations
- **Server-side operations**: Firebase Cloud Functions for mutations
- **Security**: All sensitive operations go through callable functions
- **Real-time updates**: Use Firestore listeners for live data

### 3. Data Flow Architecture
```
Frontend (Next.js) → Firebase Client SDK → Firestore (Read)
Frontend (Next.js) → Callable Functions → Firestore (Write)
External Services → Webhook Functions → Firestore (Integration)
```

## Prerequisites
- Node.js 18+ installed
- Firebase CLI installed and authenticated
- Project dependencies installed (`npm install`)

## Development Environment Setup

### 1. Smart Development Environment Startup (Recommended)
```bash
# Use the smart startup script that handles port conflicts and cleanup
./scripts/start-dev-environment.sh

# This script will:
# - Check and free required ports
# - Clean up existing Firebase processes
# - Start Firebase emulators
# - Seed test data
# - Start Next.js development server
# - Display all service URLs and test accounts
```

### 2. Manual Firebase Emulator Configuration (Alternative)
```bash
# Check for port conflicts first
lsof -i :9099,8080,9199,5001,4000,4400,9002

# Kill any conflicting processes
pkill -f "firebase emulators"
pkill -f "next dev"

# Start all required emulators
firebase emulators:start --only auth,firestore,functions,storage

# Emulator URLs:
# - Auth: http://localhost:9099
# - Firestore: http://localhost:8080
# - Functions: http://localhost:5001
# - Storage: http://localhost:9199
# - Emulator UI: http://localhost:4000
```

### 2. Environment Variables
Ensure `.env.local` contains:
```env
# Firebase Emulator Configuration
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST=localhost:5001
NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199

# Stripe Configuration (Production Test Keys)
STRIPE_SECRET_KEY=sk_test_51Ri3RzFSxDMBV1zfKF2TtP50QsqVI2ELjVVtct0DlKWLqrItzaZ4u1HvEeLtAcCybzxEwjN1lsem3no6DPYRNUq100nSrTTetZ
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Ri3RzFSxDMBV1zf9aBAnZOiFVlWaVqMM8mmof7LcSDvHCM0TRGLl1F2tiwWFWORbqwDx2tm0aPqvohPH8rDcmeV006yQbpsq8

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDZoznRXygrNINbo60NI6oidbcxd1vQSlY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=amplifydmvp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=amplifydmvp
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=amplifydmvp.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 3. Data Seeding (Production-Ready Test Data)
```bash
# Data seeding is handled automatically by the startup script
# Manual seeding (if needed):
node scripts/seedAuthUsers.js
node scripts/seedFirestore.js
```

### 4. Development Server
```bash
# Development server is started automatically by the startup script
# Manual start (if needed):
npm run dev

# Server runs on: http://localhost:9002
```

## Test User Accounts (Production-Ready)

### Admin User
- **Email**: admin@amplifyd.com
- **Password**: admin123
- **Role**: admin
- **UID**: admin_user_001

### Reviewer Users
- **Email**: alex.chen@amplifyd.com
- **Password**: reviewer123
- **Role**: reviewer
- **UID**: tD2791C6vQFlzKPu5ggp4akVdX0k

- **Email**: sarah.johnson@amplifyd.com
- **Password**: reviewer123
- **Role**: reviewer
- **UID**: reviewer_user_002

### Regular User
- **Email**: user@amplifyd.com
- **Password**: user123
- **Role**: user
- **UID**: regular_user_001

## Production-Ready Code Standards

### 1. Error Handling
- All async operations must have proper error handling
- No console.log in production code (use proper logging)
- Graceful degradation for unauthenticated users
- No mock data or placeholder values

### 2. Security Rules
- Firestore rules must be production-ready
- Storage rules must allow anonymous uploads (core feature)
- No relaxed rules for development

### 3. Data Validation
- All forms must use Zod schemas
- Server-side validation in Cloud Functions
- Client-side validation with proper error messages

### 4. Type Safety
- Full TypeScript implementation
- No `any` types
- Proper interface definitions

## Testing Protocols

### 1. Authentication Flow Testing
```bash
# Test Steps:
1. Navigate to http://localhost:9002/login
2. Login with test accounts
3. Verify role-based access
4. Test logout functionality
5. Verify unauthenticated state handling
```

### 2. File Upload Testing
```bash
# Test Steps:
1. Navigate to submission form
2. Upload audio file (WAV, MP3, M4A)
3. Verify Storage emulator receives file
4. Verify Firestore record creation
5. Test file access permissions

# Signed URL Integration (Production-Ready)
- Anonymous uploads use signed URLs for security
- Files uploaded to `/music-uploads/temp/...` initially
- Moved to permanent storage after successful payment
- Prevents storage abuse by unpaid submissions
```

### 3. Payment Flow Testing
```bash
# Test Steps:
1. Submit music for review
2. Complete Stripe payment
3. Verify webhook processing
4. Verify submission status update
5. Verify reviewer assignment
```

### 4. Review Submission Testing
```bash
# Test Steps:
1. Login as reviewer
2. Navigate to pending submissions
3. Complete review form (all fields required)
4. Submit review
5. Verify review appears in public reviews
6. Verify submission status update
```

### 5. Admin Dashboard Testing
```bash
# Test Steps:
1. Login as admin
2. Access admin dashboard
3. Verify all data displays correctly
4. Test user management
5. Test financial reports
6. Test submission management
```

## Cloud Functions Deployment

### 1. Build Functions
```bash
cd functions
npm run build
```

### 2. Verify Function Exports
Ensure `functions/src/index.ts` exports all functions:
```typescript
export * from './callable/submitApplication';
export * from './callable/createReferralCode';
export * from './callable/createPayout';
export * from './callable/updatePayoutStatus';
export * from './callable/rejectApplication';
export * from './callable/approveApplication';
export * from './callable/submitReview';
export * from './callable/getAllReviews';
export * from './callable/getReviewByToken';
export * from './callable/getSubmissionsForReviewer';
export * from './callable/updateReviewerEarnings';
export * from './callable/getSignedUploadUrl';
export { stripeWebhook } from './webhooks/stripe';
```

### 3. Restart Emulators
```bash
# Stop emulators (Ctrl+C)
# Restart with fresh functions
firebase emulators:start --only auth,firestore,functions,storage
```

## Data Flow Verification

### 1. Submission to Review Flow
```bash
# Complete Flow Test:
1. Anonymous user submits music file
2. User completes payment via Stripe
3. Stripe webhook creates submission record
4. Submission assigned to available reviewer
5. Reviewer receives notification
6. Reviewer completes review
7. Review published to public page
8. Artist receives notification
```

### 2. Data Integrity Checks
- Verify all required fields are present
- Check data types match schemas
- Ensure timestamps are properly set
- Verify relationships between collections

## Common Issues & Solutions

### 1. Port Conflicts
```bash
# Problem: "Port XXXX is not open on localhost"
# Solution: Use the smart startup script
./scripts/start-dev-environment.sh

# Manual solution:
lsof -i :9099,8080,9199,5001,4000,4400,9002
pkill -f "firebase emulators"
pkill -f "next dev"
```

### 2. Emulator Connection Issues
```bash
# Problem: Client connecting to production instead of emulators
# Solution: Verify environment variables are set correctly
# Check: .env.local contains emulator host variables
```

### 2. Function Not Found Errors
```bash
# Problem: Cloud function returns 404
# Solution: 
1. Verify function is exported in index.ts
2. Run npm run build in functions directory
3. Restart emulators
```

### 3. Permission Denied Errors
```bash
# Problem: Firestore/Storage permission errors
# Solution:
1. Check security rules
2. Verify user authentication
3. Check role-based permissions
```

### 4. Form Validation Errors
```bash
# Problem: "All review fields are required"
# Solution:
1. Ensure all required fields are present in form
2. Verify Zod schema matches form structure
3. Check form submission parameters
```

## Production Deployment Checklist

### 1. Code Quality
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] All functions properly exported
- [ ] Environment variables configured
- [ ] Security rules production-ready

### 2. Functionality
- [ ] Authentication flow works
- [ ] File uploads functional
- [ ] Payment processing works
- [ ] Review submission complete
- [ ] Admin dashboard functional
- [ ] Public reviews display correctly

### 3. Data Integrity
- [ ] All required fields validated
- [ ] Data relationships maintained
- [ ] Timestamps properly set
- [ ] User roles enforced
- [ ] Payment records accurate

## Development Commands Reference

```bash
# Smart startup (recommended)
./scripts/start-dev-environment.sh

# Manual startup (alternative)
firebase emulators:start --only auth,firestore,functions,storage &
npm run dev

# Seed test data
node scripts/seedAuthUsers.js
node scripts/seedFirestore.js

# Build functions
cd functions && npm run build

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Stop all services
pkill -f "firebase emulators" && pkill -f "next dev"

# Test specific flows
# (Use manual testing as outlined above)
```

## Critical Data Documents & Schemas

### Core Type Definitions (`src/lib/types.ts`)
- **User**: Authentication and profile data
- **Reviewer**: Extended user with review capabilities
- **Submission**: Music submission data
- **Review**: Review feedback and scoring
- **Transaction**: Payment and financial data
- **ReferralCode**: Referral system data

### Validation Schemas
All schemas use Zod for runtime validation:
```typescript
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['uploader', 'reviewer', 'admin']),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']),
  // ... other fields
});
```

## Firebase Functions Structure

### Callable Functions (`functions/src/callable/`)
- **Authentication required** for all operations
- **Input validation** using Zod schemas
- **Error handling** with proper HTTP status codes
- **Type safety** with TypeScript

### Webhook Functions (`functions/src/webhooks/`)
- **External service integrations** (Stripe, etc.)
- **No authentication required** (handled by service)
- **Idempotent operations** for reliability

## Error Prevention & Debugging

### Common Error Patterns
1. **Type Mismatches**: Ensure all data matches Zod schemas
2. **Missing Dependencies**: Check all imports and exports
3. **Authentication Issues**: Verify user context in functions
4. **Firebase Rules**: Ensure proper security rules

### Debugging Checklist
- [ ] Run `npm run lint` for frontend
- [ ] Run `npx tsc --noEmit` for type checking
- [ ] Check Firebase Functions logs
- [ ] Verify environment variables
- [ ] Test data flow end-to-end

## Media & Assets

### Default Profile Picture
- **File**: `public/USETHIS.png`
- **Usage**: Default avatar for all user accounts
- **Implementation**: 
  - Seeded accounts use `/USETHIS.png`
  - New user creation defaults to `/USETHIS.png`
  - Frontend fallback uses `/USETHIS.png`
- **Testing**: Verify profile pictures display correctly across all user interfaces

## Notes
- All development must be production-ready
- No mock data or placeholder values
- Proper error handling required
- Full type safety maintained
- Security rules must be production-appropriate
- Anonymous uploads are a core feature requirement
