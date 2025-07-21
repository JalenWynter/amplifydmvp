const admin = require('firebase-admin');

// Ensure emulator hosts are set
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

// Initialize Firebase Admin SDK
// Use a dummy project ID for emulator only
admin.initializeApp({
  projectId: 'amplifydmvp',
});

const auth = admin.auth();
const db = admin.firestore();

const usersToSeed = [
  {
    email: 'jwynterthomas@gmail.com',
    password: 'password123',
    displayName: 'Admin User',
    role: 'Admin',
  },
  {
    email: 'brenda.lee@amplifyd.com',
    password: 'password123',
    displayName: 'Brenda "Vocals" Lee',
    role: 'Reviewer',
  },
  {
    email: 'alex.chen@amplifyd.com',
    password: 'password123',
    displayName: 'Alex "Synth" Chen',
    role: 'Reviewer',
  },
  {
    email: 'cosmic@dreamer.com',
    password: 'password123',
    displayName: 'Cosmic Dreamer',
    role: 'Artist',
  },
];

async function seedAuthAndFirestoreUsers() {
  console.log('Starting Auth and Firestore user seeding...');

  for (const user of usersToSeed) {
    let uid;
    try {
      // 1. Create user in Auth Emulator
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });
      uid = userRecord.uid;
      console.log(`Successfully created Auth user: ${user.email} (UID: ${uid})`);

      // 2. Create corresponding user document in Firestore
      const userDocRef = db.collection('users').doc(uid);
      await userDocRef.set({
        id: uid,
        email: user.email,
        name: user.displayName,
        role: user.role,
        status: 'Active',
        joinedAt: new Date().toISOString(),
        avatarUrl: 'https://placehold.co/40x40.png',
      });
      console.log(`Successfully created Firestore user document for ${user.email}`);

      // 3. If role is Reviewer, create corresponding reviewer document in Firestore
      if (user.role === 'Reviewer') {
        const reviewerDocRef = db.collection('reviewers').doc(uid);
        await reviewerDocRef.set({
          id: uid,
          name: user.displayName,
          avatarUrl: 'https://placehold.co/150x150.png',
          dataAiHint: user.displayName.includes('Brenda') ? 'woman portrait' : 'man portrait',
          turnaround: '3-5 days',
          genres: user.displayName.includes('Brenda') ? ['Pop', 'R&B', 'Vocal Performance'] : ['Electronic', 'Synthwave', 'Sound Design'],
          experience: user.displayName.includes('Brenda') ? 'With over 15 years in the industry, I\'ve had the privilege of working on multiple gold-certified records. My expertise lies in indie pop and synthwave, and I specialize in mixing and mastering.' : 'As an electronic music producer, I live and breathe synths and sound design. I can help you craft unique sonic landscapes.',
          packages: user.displayName.includes('Brenda') ? [
            { id: 'pkg_01_01', name: 'Standard Written Review', priceInCents: 2500, description: 'Detailed written feedback on your track.', trackCount: 1, formats: ['written', 'chart'] },
            { id: 'pkg_01_02', name: 'Audio Commentary', priceInCents: 4000, description: 'A full audio breakdown of your song.', trackCount: 1, formats: ['audio', 'chart'] }
          ] : [
            { id: 'pkg_02_01', name: 'Synth & Sound Design Checkup', priceInCents: 3000, description: 'Deep dive into your sound design choices.', trackCount: 1, formats: ['written', 'chart'] }
          ],
        });
        console.log(`Successfully created Firestore reviewer document for ${user.email}`);
      }

    } catch (error) {
      if (error.code === 'auth/email-already-exists' || error.code === 'auth/uid-already-exists') {
        console.log(`User already exists in Auth: ${user.email}. Attempting to update Firestore documents.`);
        // If user already exists in Auth, get their UID and try to create/update Firestore docs
        const existingUser = await auth.getUserByEmail(user.email);
        uid = existingUser.uid;

        const userDocRef = db.collection('users').doc(uid);
        await userDocRef.set({
          id: uid,
          email: user.email,
          name: user.displayName,
          role: user.role,
          status: 'Active',
          joinedAt: new Date().toISOString(),
          avatarUrl: 'https://placehold.co/40x40.png',
        }, { merge: true }); // Use merge to update existing fields
        console.log(`Successfully updated Firestore user document for ${user.email}`);

        if (user.role === 'Reviewer') {
          const reviewerDocRef = db.collection('reviewers').doc(uid);
          await reviewerDocRef.set({
            id: uid,
            name: user.displayName,
            avatarUrl: user.displayName.includes('Brenda') ? 'https://placehold.co/150x150.png' : 'https://placehold.co/150x150.png',
            dataAiHint: user.displayName.includes('Brenda') ? 'woman portrait' : 'man portrait',
            turnaround: '3-5 days',
            genres: user.displayName.includes('Brenda') ? ['Pop', 'R&B', 'Vocal Performance'] : ['Electronic', 'Synthwave', 'Sound Design'],
            experience: user.displayName.includes('Brenda') ? 'With over 15 years in the industry, I\'ve had the privilege of working on multiple gold-certified records. My expertise lies in indie pop and synthwave, and I specialize in mixing and mastering.' : 'As an electronic music producer, I live and breathe synths and sound design. I can help you craft unique sonic landscapes.',
            packages: user.displayName.includes('Brenda') ? [
              { id: 'pkg_01_01', name: 'Standard Written Review', priceInCents: 2500, description: 'Detailed written feedback on your track.', trackCount: 1, formats: ['written', 'chart'] },
              { id: 'pkg_01_02', name: 'Audio Commentary', priceInCents: 4000, description: 'A full audio breakdown of your song.', trackCount: 1, formats: ['audio', 'chart'] }
            ] : [
              { id: 'pkg_02_01', name: 'Synth & Sound Design Checkup', priceInCents: 3000, description: 'Deep dive into your sound design choices.', trackCount: 1, formats: ['written', 'chart'] }
            ],
          }, { merge: true });
          console.log(`Successfully updated Firestore reviewer document for ${user.email}`);
        }

      } else {
        console.error(`Error creating user ${user.email}:`, error);
      }
    }
  }
  console.log('Auth and Firestore user seeding complete.');
}

seedAuthAndFirestoreUsers().catch(console.error);