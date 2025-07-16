# Stripe Testing Guide

## 🎯 Overview

This guide walks you through testing the complete Stripe payment flow with fake reviewers and packages.

## 📋 Prerequisites

### 1. Environment Setup

Ensure your `.env.local` file contains:
```bash
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_51Ri3RzFSxDMBV1zfKF2TtP50QsqVI2ELjVVtct0DlKWLqrItzaZ4u1HvEeLtAcCybzxEwjN1lsem3no6DPYRNUq100nSrTTetZ
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Ri3RzFSxDMBV1zf9aBAnZOiFVlWaVqMM8mmof7LcSDvHCM0TRGLl1F2tiwWFWORbqwDx2tm0aPqvohPH8rDcmeV006yQbpsq8

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Stripe CLI Installation

Install the Stripe CLI for webhook testing:
```bash
# Windows (using Scoop)
scoop install stripe

# Or download directly from: https://github.com/stripe/stripe-cli/releases
```

## 🌱 Setting Up Test Data

### Step 1: Seed Database

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Dev Setup:**
   - Go to `http://localhost:9002/dev-setup`
   - Click the "Seed Data" button
   - Wait for the success message

### Step 2: Test Reviewers Created

After seeding, you'll have these test reviewers:

#### 👩‍🎤 Brenda "Vocals" Lee
- **ID**: `reviewer_user_01`
- **Specialties**: Pop, R&B, Vocal Performance
- **Packages**:
  - **Standard Written Review**: $25.00
  - **Audio Commentary**: $40.00

#### 👨‍🎤 Alex "Synth" Chen
- **ID**: `reviewer_user_02`
- **Specialties**: Electronic, Synthwave, Sound Design
- **Packages**:
  - **Synth & Sound Design Checkup**: $30.00

## 🧪 Testing Stripe Flow

### Step 1: Set Up Webhook Listener

In a **new terminal window** (keep dev server running):

```bash
stripe listen --forward-to localhost:9002/api/webhooks/stripe
```

**Important**: Copy the webhook signing secret that appears (starts with `whsec_...`) and add it to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### Step 2: Test Payment Flow

1. **Go to Homepage:**
   - Navigate to `http://localhost:9002`
   - You should see the submission form

2. **Fill Out Submission Form:**
   ```
   Artist Name: Test Artist
   Song Title: My Test Song
   Contact Email: test@example.com
   Genre: Pop
   ```

3. **Upload Audio File:**
   - Use any MP3 or WAV file for testing
   - File should be under 200MB

4. **Select Reviewer & Package:**
   - Choose "Brenda 'Vocals' Lee"
   - Select "Standard Written Review" ($25.00)

5. **Submit & Pay:**
   - Click "Submit for Review"
   - You'll be redirected to Stripe Checkout

### Step 3: Test Payment with Stripe Test Cards

Use these test card numbers:

#### ✅ Successful Payment
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

#### ❌ Declined Payment
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

#### 🔐 Requires Authentication
```
Card Number: 4000 0025 0000 3155
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### Step 4: Verify Success

After successful payment, you should see:

1. **Stripe CLI Output:**
   ```
   2024-01-15 10:30:15   --> payment_intent.succeeded [evt_1234...]
   2024-01-15 10:30:15  <--  [200] POST http://localhost:9002/api/webhooks/stripe
   ```

2. **Browser Redirect:**
   - Redirected to `/submit-success` page
   - Success message displayed

3. **Database Check:**
   - New submission created in Firestore
   - Status should be "Submitted"

## 🔍 Testing Different Scenarios

### 1. Test Different Package Prices

Try each reviewer's packages:
- **Brenda**: $25.00 (Standard) vs $40.00 (Audio)
- **Alex**: $30.00 (Synth Review)

### 2. Test Payment Failures

Use declined test cards to ensure error handling works:
- Error messages should display
- No submission should be created
- User should be able to retry

### 3. Test Webhook Failures

1. **Stop the Stripe CLI** (webhook listener)
2. **Make a payment** - it should fail gracefully
3. **Restart the webhook listener**
4. **Check logs** for any issues

## 🚨 Common Issues & Solutions

### Issue: "Webhook signature verification failed"
**Solution**: 
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- Restart dev server after updating `.env.local`

### Issue: "Payment succeeded but no submission created"
**Solution**: 
- Check webhook listener is running
- Verify webhook endpoint is accessible
- Check server logs for errors

### Issue: "File upload fails"
**Solution**: 
- Ensure Firebase Storage is configured
- Check file size (max 200MB)
- Verify file format (MP3, WAV, M4A)

### Issue: "Reviewers not displaying"
**Solution**: 
- Run database seeding again
- Check Firebase configuration
- Verify Firestore security rules

## 📊 Monitoring & Debugging

### View Stripe Events
```bash
stripe events list --limit 10
```

### Check Webhook Logs
```bash
stripe logs tail
```

### Firebase Console
- Check Firestore for new submissions
- Monitor Storage for uploaded files
- Review Authentication logs

## 🎉 Success Criteria

Your Stripe integration is working if:

- [ ] Submission form displays reviewers and packages
- [ ] Stripe Checkout opens with correct amount
- [ ] Test payments process successfully
- [ ] Webhook receives and processes events
- [ ] Submissions are created in Firestore
- [ ] File uploads work correctly
- [ ] Error handling works for failed payments
- [ ] Success page displays after payment

## 🚀 Next Steps

Once testing is complete:

1. **Switch to Live Mode** (for production):
   - Update Stripe keys to live keys
   - Configure production webhooks
   - Test with real payment methods

2. **Set Up Monitoring**:
   - Configure Stripe webhook monitoring
   - Set up error alerting
   - Monitor payment success rates

3. **Security Review**:
   - Audit webhook security
   - Review Firebase rules
   - Check for sensitive data exposure

---

**Remember**: Always test thoroughly in development before going live! 