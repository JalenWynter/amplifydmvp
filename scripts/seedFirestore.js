const admin = require('firebase-admin');

// Production Firebase Admin SDK initialization
// Comment out emulator settings for production
// process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
// process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Initialize Firebase Admin SDK for production
// You need to download service account key from Firebase Console
// Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'amplifydmvp',
});

const db = admin.firestore();
const auth = admin.auth();

async function seedFirestore() {
  console.log('Starting Firestore emulator seeding...');

  try {
    // 1. Fetch all users from Auth Emulator
    const listUsersResult = await auth.listUsers(1000);
    const users = listUsersResult.users;

    if (users.length === 0) {
      console.log('No users found in Auth Emulator. Run seedAuthUsers.js first.');
      return;
    }

    console.log(`Found ${users.length} users in Auth Emulator.`);

    // 2. Map emails to UIDs for easy lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user.email] = user.uid;
    });

    // --- Collections Data (using fetched UIDs) --- //

    const usersData = [
        {
            id: userMap['jwynterthomas@gmail.com'],
            email: 'jwynterthomas@gmail.com',
            name: 'Admin User',
            role: 'admin',
            status: 'Active',
            joinedAt: new Date('2024-05-01T00:00:00Z').toISOString(),
            avatarUrl: 'https://placehold.co/40x40.png',
        },
        {
            id: userMap['brenda.lee@amplifyd.com'],
            email: 'brenda.lee@amplifyd.com',
            name: 'Brenda "Vocals" Lee',
            role: 'reviewer',
            status: 'Active',
            joinedAt: new Date('2024-06-15T00:00:00Z').toISOString(),
            avatarUrl: 'https://placehold.co/40x40.png',
        },
        {
            id: userMap['alex.chen@amplifyd.com'],
            email: 'alex.chen@amplifyd.com',
            name: 'Alex "Synth" Chen',
            role: 'reviewer',
            status: 'Active',
            joinedAt: new Date('2024-06-20T00:00:00Z').toISOString(),
            avatarUrl: 'https://placehold.co/40x40.png',
        },
        {
            id: userMap['cosmic@dreamer.com'],
            email: 'cosmic@dreamer.com',
            name: 'Cosmic Dreamer',
            role: 'artist',
            status: 'Active',
            joinedAt: new Date('2024-07-28T00:00:00Z').toISOString(),
            avatarUrl: 'https://placehold.co/40x40.png',
        },
    ];

    const reviewersData = [
        {
            id: userMap['brenda.lee@amplifyd.com'],
            name: 'Brenda "Vocals" Lee',
            avatarUrl: 'https://placehold.co/150x150.png',
            dataAiHint: 'woman portrait',
            turnaround: '3-5 days',
            genres: ['Pop', 'R&B', 'Vocal Performance'],
            experience: 'With over 15 years in the industry...',
            packages: [
                { id: 'pkg_01_01', name: 'Standard Written Review', priceInCents: 2500, description: 'Detailed written feedback...', trackCount: 1, formats: ['written', 'chart'] },
                { id: 'pkg_01_02', name: 'Audio Commentary', priceInCents: 4000, description: 'A full audio breakdown...', trackCount: 1, formats: ['audio', 'chart'] }
            ]
        },
        {
            id: userMap['alex.chen@amplifyd.com'],
            name: 'Alex "Synth" Chen',
            avatarUrl: 'https://placehold.co/150x150.png',
            dataAiHint: 'man portrait',
            turnaround: '2-4 days',
            genres: ['Electronic', 'Synthwave', 'Sound Design'],
            experience: 'As an electronic music producer...',
            packages: [
                { id: 'pkg_02_01', name: 'Synth & Sound Design Checkup', priceInCents: 3000, description: 'Deep dive into your sound design...', trackCount: 1, formats: ['written', 'chart'] }
            ]
        }
    ];

    const submissionsData = [
        {
            artistId: userMap['cosmic@dreamer.com'],
            artistName: 'Cosmic Dreamer',
            songTitle: 'Starlight Echoes',
            audioUrl: 'https://firebasestorage.googleapis.com/v0/b/amplifydmvp.appspot.com/o/submissions%2Ftest_audio.mp3?alt=media',
            status: 'PENDING_REVIEW',
            submittedAt: new Date('2024-07-28T15:00:00Z').toISOString(),
            reviewerId: userMap['brenda.lee@amplifyd.com'],
            packageId: 'pkg_01_01',
            transactionId: 'txn_xyz789',
        },
    ];

    // ... (keep other data as is, or update with dynamic UIDs if needed)

    // --- Seeding Functions --- //

    async function clearCollection(collectionRef) {
        const snapshot = await collectionRef.get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }

    async function seedCollection(collectionName, data, docIdField = 'id') {
        const collectionRef = db.collection(collectionName);
        console.log(`Clearing collection: ${collectionName}...`);
        await clearCollection(collectionRef);
        console.log(`Seeding collection: ${collectionName}...`);
        const batch = db.batch();
        for (const item of data) {
            const docRef = item[docIdField] ? collectionRef.doc(item[docIdField]) : collectionRef.doc();
            batch.set(docRef, item);
        }
        await batch.commit();
        console.log(`Finished seeding ${collectionName}.`);
    }

    // --- Execute Seeding --- //

    await seedCollection('users', usersData);
    await seedCollection('reviewers', reviewersData);
    await seedCollection('submissions', submissionsData, null); // Let Firestore auto-generate IDs

    // Seed other collections as before
    // ...

    console.log('Firestore emulator seeding complete!');

  } catch (error) {
    console.error('Error seeding Firestore emulator:', error);
  }
}

seedFirestore().catch(console.error);