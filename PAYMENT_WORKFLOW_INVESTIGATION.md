# Payment-to-Reviewer Workflow Investigation

## Current Issue
- **Problem**: Submissions are not appearing in reviewer accounts after successful Stripe payment
- **Expected Flow**: User uploads music → pays via Stripe → submission appears in assigned reviewer's dashboard
- **Actual Flow**: User uploads music → pays via Stripe → success page shows → submission NOT appearing in reviewer account

## Workflow Analysis

### 1. Payment Flow (Working)
```
User submits form → createCheckoutSession() → Stripe checkout → Success page
```

### 2. Submission Creation Flow (BROKEN)
```
Stripe webhook → stripeWebhook() → Firestore submission creation → Reviewer dashboard
```

## Key Findings

### A. Transaction Permission Error
- **Error**: `7 PERMISSION_DENIED: Missing or insufficient permissions` in `createTransaction()`
- **Location**: `src/app/actions/stripe.ts:81`
- **Cause**: Firestore rules blocking anonymous transaction creation
- **Fix Applied**: Updated `firestore.rules` to allow `isDevelopmentMode() || isAdmin()` for transaction creation

### B. Webhook Function Issues
- **Status**: Webhook function deployed but not responding to test calls
- **Test Result**: `curl` returns `{"code":"ECONNRESET"}`
- **Location**: `functions/src/webhooks/stripe.ts`
- **Export Status**: ✅ Exported in `functions/src/index.ts`

### C. Submission Creation Logic
- **Trigger**: `checkout.session.completed` Stripe webhook event
- **Required Metadata**: `artistName`, `songTitle`, `contactEmail`, `audioUrl`, `genre`, `reviewerId`, `packageId`
- **Firestore Collection**: `submissions`
- **Status**: `"pending"` (initial state)

## Critical Components

### 1. Stripe Webhook Handler
```typescript
// functions/src/webhooks/stripe.ts
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
    // Handles checkout.session.completed events
    // Creates submission in Firestore
    // Sends notification to reviewer
});
```

### 2. Submission Data Structure
```typescript
{
    artistName: string,
    songTitle: string,
    uploaderEmail: string,
    songUrl: string,
    genre: string,
    reviewerId: string,
    packageId: string,
    paymentIntentId: string,
    trackingToken: string,
    status: "pending",
    submittedAt: Timestamp
}
```

### 3. Reviewer Dashboard Query
```typescript
// functions/src/callable/getSubmissionsForReviewer.ts
// Queries submissions where reviewerId matches authenticated user
```

## Testing Steps Required

### 1. Verify Webhook Function
- [ ] Test webhook endpoint directly
- [ ] Verify function logs in emulator
- [ ] Check if webhook receives Stripe events

### 2. Verify Submission Creation
- [ ] Check if submissions are created in Firestore
- [ ] Verify submission data structure
- [ ] Confirm reviewerId assignment

### 3. Verify Reviewer Dashboard
- [ ] Check if reviewer can see pending submissions
- [ ] Verify authentication and role checks
- [ ] Test submission assignment logic

## Immediate Actions Needed

1. **Restart Emulators**: Ensure webhook function is properly deployed
2. **Test Webhook**: Verify webhook responds to test events
3. **Monitor Logs**: Check emulator logs for webhook execution
4. **Verify Data**: Confirm submissions are created in Firestore
5. **Test Reviewer Access**: Ensure reviewer can see assigned submissions

## Environment Status
- **Emulators**: ✅ Running with debug mode
- **Firestore Rules**: ✅ Updated to allow transaction creation
- **Webhook Function**: ❌ Not responding to direct curl tests
- **Test Data**: ✅ Seeded successfully
- **Development Server**: ✅ Starting

## Current Investigation Results

### Webhook Function Testing
- **Direct curl test**: Returns `{"code":"ECONNRESET"}`
- **Function deployment**: Appears to be deployed but not responding
- **Possible issues**:
  1. Function not properly compiled/deployed
  2. Stripe signature verification failing
  3. Function timing out or crashing

### Transaction Permission Fix
- **Status**: ✅ Fixed
- **Change**: Updated `firestore.rules` to allow `isDevelopmentMode() || isAdmin()` for transaction creation
- **Result**: Should resolve the `7 PERMISSION_DENIED` error

## Testing Strategy

### Phase 1: Complete Payment Flow Test
1. Navigate to reviewer page
2. Submit a test song with payment
3. Complete Stripe checkout
4. Check if submission appears in reviewer dashboard

### Phase 2: Webhook Debugging
1. Monitor emulator logs during payment
2. Check if webhook receives events
3. Verify submission creation in Firestore
4. Test reviewer dashboard access

### Phase 3: Manual Verification
1. Check Firestore directly for submissions
2. Verify reviewer authentication
3. Test dashboard queries

## Next Steps
1. Complete payment flow test with real Stripe checkout
2. Monitor emulator logs for webhook execution
3. Verify submission creation in Firestore
4. Test reviewer dashboard access
5. Document any remaining issues
