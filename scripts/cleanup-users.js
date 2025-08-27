const admin = require('firebase-admin');

// Emulator settings for development
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

// Initialize Firebase Admin SDK for emulators
admin.initializeApp({
  projectId: 'amplifydmvp',
});

const auth = admin.auth();
const db = admin.firestore();

async function cleanupAndReseed() {
  console.log('🧹 Cleaning up all users and reseeding with 3 correct users...\n');

  try {
    // 1. List all current users
    const listUsersResult = await auth.listUsers(1000);
    console.log(`Found ${listUsersResult.users.length} users in Auth Emulator:`);
    listUsersResult.users.forEach(user => {
      console.log(`  - ${user.email} (${user.uid})`);
    });

    // 2. Delete all users
    console.log('\n🗑️ Deleting all users...');
    for (const user of listUsersResult.users) {
      try {
        await auth.deleteUser(user.uid);
        console.log(`  ✅ Deleted: ${user.email}`);
      } catch (error) {
        console.log(`  ⚠️ Could not delete ${user.email}: ${error.message}`);
      }
    }

    // 3. Clear Firestore collections
    console.log('\n🗑️ Clearing Firestore collections...');
    const collections = ['users', 'reviewers', 'submissions', 'reviews', 'settings'];
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`  ✅ Cleared: ${collectionName}`);
    }

    console.log('\n✅ Cleanup complete! Now run: node scripts/seedAuthUsers.js');
    console.log('Then run: node scripts/seedFirestore.js');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupAndReseed().catch(console.error);
