# Firebase Best Practices Reference Guide

## **Architecture Overview**

### **Client-Side vs Server-Side Operations**

#### **Client-Side SDK (Firebase Client)**
**Use for:**
- User authentication (sign in/out)
- User-facing operations (submissions, reviews, profile updates)
- Real-time data listening
- File uploads to Storage
- Basic CRUD operations that users can perform

**Examples:**
```typescript
// User submits music
const audioUrl = await uploadMusicFile(file);
await createSubmissionViaFunction(submissionData);

// User writes review
await submitReview(reviewData);

// User updates profile
await updateReviewerProfile(profileData);
```

#### **Server-Side SDK (Firebase Admin)**
**Use for:**
- Admin operations (dashboard stats, user management)
- Sensitive data access
- Bulk operations
- Operations that bypass security rules
- Webhook handlers
- Background processing

**Examples:**
```typescript
// Admin dashboard stats
export const getAdminDashboardStats = onCall(async (request) => {
    const [users, submissions, reviews] = await Promise.all([
        db.collection("users").get(),
        db.collection("submissions").get(),
        db.collection("reviews").get()
    ]);
    return { stats: { totalUsers: users.size, ... } };
});
```

## **Authentication & Authorization Patterns**

### **Emulator Mode**
```typescript
// Check if running in emulator
const isEmulatorMode = process.env.FUNCTIONS_EMULATOR === 'true' || 
                       process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;

// Emulator: Allow any authenticated user for admin functions
if (isEmulatorMode) {
    // Skip admin role check, allow testing
    return allowAccess();
}
```

### **Production Mode**
```typescript
// Production: Strict admin role verification
if (!request.auth || request.auth.token.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
}
```

## **Security Rules Strategy**

### **Client-Side Rules (Firestore)**
```javascript
// Allow users to read their own data
match /users/{userId} {
    allow read, write: if request.auth.uid == userId;
}

// Allow public read for reviews
match /reviews/{reviewId} {
    allow read: if true;
    allow write: if request.auth != null && 
                 get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'reviewer';
}

// Allow anonymous submissions
match /submissions/{submissionId} {
    allow create: if true; // Anonymous submissions
    allow read: if request.auth != null;
}
```

### **Server-Side Bypass (Cloud Functions)**
```typescript
// Cloud functions bypass client-side rules
const adminDb = admin.firestore();
const allUsers = await adminDb.collection("users").get(); // No rules applied
```

## **Data Flow Patterns**

### **User Operations (Client-Side)**
```
User Action → Client SDK → Firestore (with rules) → UI Update
```

### **Admin Operations (Server-Side)**
```
Admin Action → Cloud Function → Admin SDK → Firestore (no rules) → Response
```

### **Payment Processing**
```
User Payment → Stripe → Webhook → Cloud Function → Admin SDK → Database Update
```

## **Error Handling Patterns**

### **Client-Side Error Handling**
```typescript
try {
    const result = await clientFunction();
    return result;
} catch (error) {
    // Log error, show user-friendly message
    console.error("Client operation failed:", error);
    throw new Error("Operation failed. Please try again.");
}
```

### **Server-Side Error Handling**
```typescript
try {
    const result = await adminFunction();
    return { success: true, data: result };
} catch (error) {
    // Log detailed error, return structured response
    console.error("Server operation failed:", error);
    return { success: false, error: error.message };
}
```

## **Development vs Production Configuration**

### **Environment Variables**
```typescript
// .env.local (Development)
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST=localhost:5001
NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199

// .env.production (Production)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

### **Function Configuration**
```typescript
// Emulator detection
const isEmulatorMode = process.env.FUNCTIONS_EMULATOR === 'true';

// Conditional logic
if (isEmulatorMode) {
    // Use test data, relaxed permissions
    return getTestData();
} else {
    // Use production data, strict permissions
    return getProductionData();
}
```

## **Testing Strategy**

### **Emulator Testing**
1. **Start emulators** with test data
2. **Use client SDK** for user operations
3. **Use cloud functions** for admin operations
4. **Bypass authentication** for admin functions
5. **Test complete workflows** end-to-end

### **Production Testing**
1. **Use staging environment** with real Firebase
2. **Test with real authentication**
3. **Verify security rules** work correctly
4. **Test admin role enforcement**
5. **Monitor function performance**

## **File Structure Best Practices**

```
src/
├── lib/
│   ├── firebase/
│   │   ├── client.ts          # Client SDK configuration
│   │   ├── admin.ts           # Admin SDK configuration (server-side)
│   │   ├── services.ts        # Client-side service functions
│   │   └── admin/             # Admin-specific functions
│   │       ├── dashboard.ts   # Admin dashboard operations
│   │       └── users.ts       # Admin user management
├── app/
│   ├── api/                   # Next.js API routes (server-side)
│   └── admin/                 # Admin pages
└── functions/
    └── src/
        ├── callable/          # Callable functions
        ├── webhooks/          # Webhook handlers
        └── admin/             # Admin cloud functions
```

## **Performance Considerations**

### **Client-Side Optimization**
- Use `getDocs()` for small datasets
- Use `onSnapshot()` for real-time updates
- Implement pagination for large lists
- Cache frequently accessed data

### **Server-Side Optimization**
- Use batch operations for multiple writes
- Implement connection pooling
- Use indexes for complex queries
- Cache expensive operations

## **Security Best Practices**

### **Client-Side Security**
- Never expose API keys in client code
- Use security rules for data access control
- Validate user input before sending to server
- Implement rate limiting for user actions

### **Server-Side Security**
- Always verify authentication in cloud functions
- Use admin SDK for sensitive operations
- Implement proper error handling
- Log security events for monitoring

## **Migration Strategy**

### **From Client-Side to Server-Side**
1. **Identify admin operations** that need server-side processing
2. **Create cloud functions** for these operations
3. **Update client code** to call cloud functions
4. **Test thoroughly** in emulator environment
5. **Deploy to production** with proper monitoring

### **Testing Checklist**
- [ ] All user operations work in emulator
- [ ] All admin operations work in emulator
- [ ] Authentication flows work correctly
- [ ] Error handling works as expected
- [ ] Performance is acceptable
- [ ] Security rules are enforced
- [x] Admin role verification works
- [x] Payment processing works end-to-end
- [x] Emulator environment fully functional
- [x] Data seeding complete (3 users: admin, reviewer, uploader)
- [x] Cloud functions deployed and working
- [x] Error handling implemented for unauthenticated states
- [x] Admin dashboard loads with demo data fallbacks
- [x] User structure matches requirements (admin, reviewer, artist/uploader)
