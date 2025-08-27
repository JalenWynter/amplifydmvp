const admin = require('firebase-admin');

// Emulator settings for development
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Initialize Firebase Admin SDK for emulators
admin.initializeApp({
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
            avatarUrl: '/USETHIS.png',
        },
        {
            id: userMap['brenda.lee@amplifyd.com'],
            email: 'brenda.lee@amplifyd.com',
            name: 'Brenda "Vocals" Lee',
            role: 'reviewer',
            status: 'Active',
            joinedAt: new Date('2024-06-15T00:00:00Z').toISOString(),
            avatarUrl: '/USETHIS.png',
        },
        {
            id: userMap['cosmic@dreamer.com'],
            email: 'cosmic@dreamer.com',
            name: 'Cosmic Dreamer',
            role: 'uploader',
            status: 'Active',
            joinedAt: new Date('2024-07-28T00:00:00Z').toISOString(),
            avatarUrl: '/USETHIS.png',
        },
    ];

    const reviewersData = [
        {
            id: userMap['brenda.lee@amplifyd.com'],
            name: 'Brenda "Vocals" Lee',
            avatarUrl: '/USETHIS.png',
            dataAiHint: 'woman portrait',
            turnaround: '3-5 days',
            genres: ['Pop', 'R&B', 'Vocal Performance'],
            experience: 'With over 15 years in the industry, I\'ve had the privilege of working on multiple gold-certified records. My expertise lies in indie pop and synthwave, and I specialize in mixing and mastering.',
            packages: [
                { id: 'pkg_01_01', name: 'Standard Written Review', priceInCents: 2500, description: 'Detailed written feedback on your track.', trackCount: 1, formats: ['written', 'chart'] },
                { id: 'pkg_01_02', name: 'Audio Commentary', priceInCents: 4000, description: 'A full audio breakdown of your song.', trackCount: 1, formats: ['audio', 'chart'] }
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

    const reviewsData = [
        {
            id: 'review_001',
            reviewerId: userMap['brenda.lee@amplifyd.com'],
            submissionId: 'submission_001',
            overallScore: 8.5,
            scores: {
                originality: 8,
                structure: 9,
                melody: 8,
                lyrics: 7,
                vocal_performance: 9,
                instrumental_performance: 8,
                energy: 8,
                technical_skill: 7,
                sound_quality: 8,
                mixing: 8,
                sound_design: 7,
                mastering: 8,
                commercial_potential: 8,
                target_audience: 8,
                branding: 7,
                uniqueness: 8
            },
            strengths: 'This track demonstrates excellent vocal performance and strong melodic structure. The production quality is professional and the arrangement keeps the listener engaged throughout.',
            improvements: 'The lyrics could be more specific and personal to create a stronger emotional connection. Consider adding more dynamic range in the bridge section.',
            summary: 'A solid pop track with strong commercial potential. The vocal performance is the standout element, supported by clean production and catchy melodies.',
            createdAt: new Date('2024-07-29T10:00:00Z').toISOString(),
            submissionDetails: {
                artistName: 'Cosmic Dreamer',
                songTitle: 'Starlight Echoes'
            }
        }
    ];

    const appSettingsData = {
        id: 'app-config',
        applicationMode: 'open',
        maintenanceMode: false,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedFileTypes: ['mp3', 'wav', 'aiff', 'm4a'],
        reviewTurnaroundTime: '3-5 days',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

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
    await seedCollection('reviews', reviewsData);
    await seedCollection('settings', [appSettingsData]);

    // Seed other collections as before
    // ...

    console.log('Firestore emulator seeding complete!');

  } catch (error) {
    console.error('Error seeding Firestore emulator:', error);
  }
}

seedFirestore().catch(console.error);