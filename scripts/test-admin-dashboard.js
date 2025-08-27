const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase config for emulator - using actual project config
const firebaseConfig = {
  apiKey: "AIzaSyDZoznRXygrNINbo60NI6oidbcxd1vQSlY",
  authDomain: "amplifydmvp.firebaseapp.com",
  projectId: "amplifydmvp",
  storageBucket: "amplifydmvp.appspot.com",
  messagingSenderId: "486875334710",
  appId: "1:486875334710:web:aa477f4f137cac9d3f7097"
};

// Initialize Firebase with emulator settings
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);

// Connect to emulators
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = 'localhost:5001';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

async function testAdminDashboard() {
    console.log('🧪 Testing Admin Dashboard Functionality...\n');

    try {
        // Test 1: Check if emulators are running
        console.log('1️⃣ Testing emulator connectivity...');
        
        // Wait a moment for emulator connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const usersSnapshot = await getDocs(collection(db, 'users'));
        console.log(`✅ Firestore connected: ${usersSnapshot.size} users found\n`);

        // Test 2: Test admin dashboard cloud function
        console.log('2️⃣ Testing admin dashboard cloud function...');
        const getAdminDashboardStats = httpsCallable(functions, 'getAdminDashboardStats');
        const result = await getAdminDashboardStats();
        console.log('✅ Admin dashboard function called successfully');
        console.log('📊 Dashboard stats:', result.data);
        console.log('');

        // Test 3: Test data access
        console.log('3️⃣ Testing data access...');
        const [users, submissions, reviews] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'submissions')),
            getDocs(collection(db, 'reviews'))
        ]);
        
        console.log(`✅ Users: ${users.size}`);
        console.log(`✅ Submissions: ${submissions.size}`);
        console.log(`✅ Reviews: ${reviews.size}\n`);

        // Test 4: Verify data structure
        console.log('4️⃣ Verifying data structure...');
        if (users.size > 0) {
            const userData = users.docs[0].data();
            console.log('✅ User data structure:', Object.keys(userData));
        }
        
        if (submissions.size > 0) {
            const submissionData = submissions.docs[0].data();
            console.log('✅ Submission data structure:', Object.keys(submissionData));
        }

        console.log('\n🎉 All tests passed! Admin dashboard should work correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure emulators are running');
        console.log('2. Check if data is seeded');
        console.log('3. Verify cloud functions are deployed');
    }
}

// Run the test
testAdminDashboard();
