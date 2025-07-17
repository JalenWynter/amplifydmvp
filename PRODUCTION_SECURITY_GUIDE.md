# 🔒 Production Security Guide for Public Reviews

## 🎯 Overview

This guide covers all security configurations needed for production deployment of the public reviews system.

## 🔥 Firestore Security Rules

### Current State
- **OPEN RULES**: `allow read, write: if true;` - Development only
- **RISK**: All data publicly accessible and writable

### Production Rules Required

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // REVIEWS COLLECTION - PUBLIC READ ACCESS
    match /reviews/{reviewId} {
      // Allow public read access to reviews
      allow read: if true;
      
      // Only authenticated reviewers can create reviews
      allow create: if request.auth != null 
        && request.auth.uid == resource.data.reviewerId;
      
      // Only the reviewer who created it can update
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.reviewerId;
      
      // No delete access (reviews are permanent)
      allow delete: if false;
    }
    
    // REVIEWERS COLLECTION - PUBLIC READ ACCESS
    match /reviewers/{reviewerId} {
      // Allow public read access to reviewer profiles
      allow read: if true;
      
      // Only the reviewer can update their own profile
      allow write: if request.auth != null 
        && request.auth.uid == reviewerId;
    }
    
    // SUBMISSIONS COLLECTION - RESTRICTED ACCESS
    match /submissions/{submissionId} {
      // Only reviewers can read assigned submissions
      allow read: if request.auth != null 
        && request.auth.uid == resource.data.reviewerId;
      
      // Only system can create submissions (via server-side functions)
      allow create: if false;
      
      // Only assigned reviewer can update status
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.reviewerId
        && request.resource.data.diff(resource.data).affectedKeys()
           .hasOnly(['status']);
      
      allow delete: if false;
    }
    
    // USERS COLLECTION - RESTRICTED ACCESS
    match /users/{userId} {
      // Users can only read their own data
      allow read: if request.auth != null 
        && request.auth.uid == userId;
      
      // Users can only update their own data
      allow update: if request.auth != null 
        && request.auth.uid == userId;
      
      // No public creation or deletion
      allow create, delete: if false;
    }
    
    // APPLICATIONS COLLECTION - ADMIN ONLY
    match /applications/{applicationId} {
      // Only admins can access applications
      allow read, write: if request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }
    
    // TRANSACTIONS COLLECTION - ADMIN ONLY
    match /transactions/{transactionId} {
      // Only admins can access transaction data
      allow read, write: if request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }
    
    // PAYOUTS COLLECTION - ADMIN ONLY
    match /payouts/{payoutId} {
      // Only admins can access payout data
      allow read, write: if request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }
    
    // REFERRAL CODES COLLECTION - ADMIN ONLY
    match /referralCodes/{codeId} {
      // Only admins can access referral codes
      allow read, write: if request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }
    
    // DENY ALL OTHER ACCESS
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 🗂️ Storage Security Rules

### Current State
- **OPEN RULES**: `allow read, write: if true;` - Development only
- **RISK**: All files publicly accessible

### Production Rules Required

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // SUBMISSIONS FOLDER - RESTRICTED ACCESS
    match /submissions/{allPaths=**} {
      // Only authenticated reviewers can read submission files
      allow read: if request.auth != null;
      
      // Only system can write files (server-side upload)
      allow write: if false;
    }
    
    // REVIEWER AVATARS - PUBLIC READ ACCESS
    match /reviewers/{reviewerId}/avatar {
      // Public read access for reviewer avatars
      allow read: if true;
      
      // Only the reviewer can update their avatar
      allow write: if request.auth != null 
        && request.auth.uid == reviewerId;
    }
    
    // DENY ALL OTHER ACCESS
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## 🔐 Data Privacy Considerations

### 🚨 Sensitive Data to Protect

**❌ Never Expose Publicly:**
- `contactEmail` from submissions
- `stripeSessionId` from transactions
- `paymentIntentId` from transactions
- User authentication data
- Admin-only information

**✅ Safe for Public Access:**
- `artistName` and `songTitle` (from reviews)
- `overallScore` and `scores` (from reviews)
- `strengths`, `improvements`, `summary` (from reviews)
- `createdAt` (from reviews)
- Reviewer profiles (name, experience, genres)

### 🔄 Data Sanitization Required

Update the `getAllReviews()` function to sanitize data:

```typescript
export async function getAllReviews(): Promise<Review[]> {
    console.log("Fetching all completed reviews for public display...");
    const reviewsCol = collection(db, "reviews");
    const q = query(reviewsCol, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const reviews = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Sanitize sensitive data before returning
        return {
            id: doc.id,
            // Remove sensitive fields
            submissionId: undefined, // Don't expose submission ID
            reviewerId: data.reviewerId, // Keep for reviewer lookup
            scores: data.scores,
            overallScore: data.overallScore,
            strengths: data.strengths,
            improvements: data.improvements,
            summary: data.summary,
            createdAt: data.createdAt,
            submissionDetails: {
                artistName: data.submissionDetails.artistName,
                songTitle: data.submissionDetails.songTitle
            }
        };
    }) as Review[];
    
    return reviews;
}
```

## 🔍 Firestore Indexes Required

### Composite Indexes Needed

Add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "overallScore",
          "order": "DESCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

## 🛡️ Server-Side Security Functions

### Required Cloud Functions

**1. Secure Review Creation**
```typescript
// Only server-side functions should create reviews
export const createReviewSecure = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  // Verify reviewer role
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();
    
  if (!userDoc.exists || userDoc.data()?.role !== 'Reviewer') {
    throw new functions.https.HttpsError('permission-denied', 'Must be a reviewer');
  }
  
  // Create review with server-side validation
  // ... implementation
});
```

**2. Secure Submission Creation**
```typescript
// Only Stripe webhooks should create submissions
export const createSubmissionFromWebhook = functions.https.onRequest(async (req, res) => {
  // Verify Stripe webhook signature
  // Create submission with sanitized data
  // ... implementation
});
```

## 🔒 Environment Variables

### Required for Production

```bash
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Stripe
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Security
NEXT_PUBLIC_HOST_URL=https://your-domain.com
ENCRYPTION_KEY=your-encryption-key
```

## 🚀 Deployment Checklist

### Before Production Deploy

- [ ] Update Firestore rules to production version
- [ ] Update Storage rules to production version
- [ ] Deploy Firestore indexes
- [ ] Set up Cloud Functions for secure operations
- [ ] Configure environment variables
- [ ] Test all security rules in staging
- [ ] Remove development seed data
- [ ] Enable authentication providers
- [ ] Set up monitoring and logging
- [ ] Configure CORS for production domain
- [ ] Set up SSL certificates
- [ ] Configure rate limiting
- [ ] Set up backup and recovery

### Security Testing

- [ ] Test public review access works
- [ ] Test sensitive data is protected
- [ ] Test authentication requirements
- [ ] Test role-based access control
- [ ] Test file upload security
- [ ] Test API rate limiting
- [ ] Test error handling doesn't leak data

## 📊 Monitoring & Alerts

### Required Monitoring

```typescript
// Log all public review accesses
export const logReviewAccess = functions.firestore
  .document('reviews/{reviewId}')
  .onRead(async (snapshot, context) => {
    console.log(`Review accessed: ${context.params.reviewId}`);
    // Log to monitoring service
  });
```

### Set Up Alerts For

- Unusual access patterns
- Failed authentication attempts
- Rule violations
- Performance issues
- Storage usage spikes

---

## 🎯 Summary

**Key Changes for Production:**
1. **Firestore Rules**: Allow public read for reviews/reviewers, restrict everything else
2. **Storage Rules**: Restrict file access to authenticated users only
3. **Data Sanitization**: Remove sensitive fields from public APIs
4. **Server-Side Functions**: Move sensitive operations to Cloud Functions
5. **Monitoring**: Track access patterns and security events

**This ensures your public reviews system is secure, performant, and compliant with privacy standards.** 