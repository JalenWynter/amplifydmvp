const admin = require('firebase-admin');

// Ensure the emulator host is set
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

// Initialize Firebase Admin SDK
// Use a dummy project ID for emulator only
admin.initializeApp({
  projectId: 'amplifydmvp',
});

const db = admin.firestore();

// --- Example Data --- //
// These UIDs should match those created in the Auth Emulator
const TEST_ADMIN_UID = 'admin_user_01';
const TEST_REVIEWER_1_UID = 'reviewer_user_01';
const TEST_REVIEWER_2_UID = 'reviewer_user_02';
const TEST_ARTIST_UID = 'artist_user_01';

const usersData = [
  {
    id: TEST_ADMIN_UID,
    email: 'jwynterthomas@gmail.com',
    name: 'Admin User',
    role: 'Admin',
    status: 'Active',
    joinedAt: new Date('2024-05-01T00:00:00Z').toISOString(),
    avatarUrl: 'https://placehold.co/40x40.png',
  },
  {
    id: TEST_REVIEWER_1_UID,
    email: 'brenda.lee@amplifyd.com',
    name: 'Brenda "Vocals" Lee',
    role: 'Reviewer',
    status: 'Active',
    joinedAt: new Date('2024-06-15T00:00:00Z').toISOString(),
    avatarUrl: 'https://placehold.co/40x40.png',
  },
  {
    id: TEST_REVIEWER_2_UID,
    email: 'alex.chen@amplifyd.com',
    name: 'Alex "Synth" Chen',
    role: 'Reviewer',
    status: 'Active',
    joinedAt: new Date('2024-06-20T00:00:00Z').toISOString(),
    avatarUrl: 'https://placehold.co/40x40.png',
  },
  {
    id: TEST_ARTIST_UID,
    email: 'cosmic@dreamer.com',
    name: 'Cosmic Dreamer',
    role: 'Artist',
    status: 'Active',
    joinedAt: new Date('2024-07-28T00:00:00Z').toISOString(),
    avatarUrl: 'https://placehold.co/40x40.png',
  },
];

const reviewersData = [
  {
    id: TEST_REVIEWER_1_UID,
    name: 'Brenda "Vocals" Lee',
    avatarUrl: 'https://placehold.co/150x150.png',
    dataAiHint: 'woman portrait',
    turnaround: '3-5 days',
    genres: ['Pop', 'R&B', 'Vocal Performance'],
    experience: 'With over 15 years in the industry, I\'ve had the privilege of working on multiple gold-certified records. My expertise lies in indie pop and synthwave, and I specialize in mixing and mastering.',
    packages: [
      { id: 'pkg_01_01', name: 'Standard Written Review', priceInCents: 2500, description: 'Detailed written feedback on your track.', trackCount: 1, formats: ['written', 'chart'] },
      { id: 'pkg_01_02', name: 'Audio Commentary', priceInCents: 4000, description: 'A full audio breakdown of your song.', trackCount: 1, formats: ['audio', 'chart'] }
    ]
  },
  {
    id: TEST_REVIEWER_2_UID,
    name: 'Alex "Synth" Chen',
    avatarUrl: 'https://placehold.co/150x150.png',
    dataAiHint: 'man portrait',
    turnaround: '2-4 days',
    genres: ['Electronic', 'Synthwave', 'Sound Design'],
    experience: 'As an electronic music producer, I live and breathe synths and sound design. I can help you craft unique sonic landscapes.',
    packages: [
      { id: 'pkg_02_01', name: 'Synth & Sound Design Checkup', priceInCents: 3000, description: 'Deep dive into your sound design choices.', trackCount: 1, formats: ['written', 'chart'] }
    ]
  }
];

const settingsData = {
  'app-config': {
    applicationMode: 'INVITE_ONLY',
    stripePublicKey: 'pk_test_YOUR_STRIPE_PUBLIC_KEY',
    adminEmail: 'jwynterthomas@gmail.com',
  }
};

const applicationsData = [
  {
    userId: null,
    name: 'John Doe',
    email: 'john.doe@example.com',
    status: 'PENDING_REVIEW',
    primaryRole: 'Producer / Engineer',
    portfolioLink: 'https://linkedin.com/in/johndoeproducer',
    musicBackground: 'With over 15 years in the industry, I\'ve worked on multiple gold-certified records.',
    joinReason: 'I\'m passionate about discovering new talent and helping artists refine their sound.',
    referral: '',
    submittedAt: new Date('2024-07-28T14:30:00Z').toISOString(),
  },
];

const referralCodesData = [
  { code: 'INVITE-USED123', associatedUser: 'brenda.lee@amplifyd.com', status: 'USED', createdAt: new Date('2024-07-20T00:00:00Z').toISOString() },
  { code: 'INVITE-ACTIVE456', associatedUser: 'alex.chen@amplifyd.com', status: 'ACTIVE', createdAt: new Date().toISOString() },
  { code: 'INVITE-EXPIRED789', associatedUser: 'jwynterthomas@gmail.com', status: 'EXPIRED', createdAt: new Date('2024-07-01T00:00:00Z').toISOString() }
];

const submissionsData = [
  {
    artistName: 'Cosmic Dreamer',
    songTitle: 'Starlight Echoes',
    audioUrl: 'https://firebasestorage.googleapis.com/v0/b/amplifydmvp.appspot.com/o/submissions%2Ftest_audio.mp3?alt=media',
    status: 'PENDING_REVIEW',
    submittedAt: new Date('2024-07-28T15:00:00Z').toISOString(),
    reviewerId: TEST_REVIEWER_1_UID,
    packageId: 'pkg_01_01',
    transactionId: 'txn_xyz789',
  },
  {
    artistName: 'Lofi Beats',
    songTitle: 'Chill Waves',
    audioUrl: 'https://firebasestorage.googleapis.com/v0/b/amplifydmvp.appspot.com/o/submissions%2Ftest_audio2.mp3?alt=media',
    status: 'REVIEWED',
    submittedAt: new Date('2024-07-27T10:00:00Z').toISOString(),
    reviewerId: TEST_REVIEWER_2_UID,
    packageId: 'pkg_02_01',
    transactionId: 'txn_abc123',
  },
];

const reviewsData = [
  {
    submissionId: 'sub_abc123', // Assuming this matches a submission ID
    reviewerId: TEST_REVIEWER_2_UID,
    scores: { production: 8, vocals: 7, lyrics: 9 },
    overallScore: 8.0,
    strengths: 'Strong melody, clear vocals.',
    improvements: 'Mix could be wider.',
    summary: 'A solid track with great potential.',
    createdAt: new Date('2024-07-30T10:00:00Z').toISOString(),
    submissionDetails: { artistName: 'Lofi Beats', songTitle: 'Chill Waves' }
  }
];

const transactionsData = [
  {
    userId: TEST_ARTIST_UID,
    amount: 2500,
    currency: 'USD',
    status: 'COMPLETED',
    stripeSessionId: 'cs_test_123',
    submissionId: 'sub_abc123',
    createdAt: new Date('2024-07-28T15:05:00Z').toISOString(),
    updatedAt: new Date('2024-07-28T15:06:00Z').toISOString(),
  },
];

const payoutsData = [
  {
    reviewer: { id: TEST_REVIEWER_1_UID, name: 'Brenda "Vocals" Lee', email: 'brenda.lee@amplifyd.com', avatarUrl: 'https://placehold.co/40x40.png' },
    amount: '$450.00',
    status: 'Paid',
    date: new Date('2024-07-15T00:00:00Z').toISOString(),
    paidDate: new Date('2024-07-18T00:00:00Z').toISOString(),
    paymentMethod: 'PayPal',
    reviews: [ { id: 'rev_01', artist: 'Cosmic Dreamer', song: 'Starlight Echoes', date: '2024-07-10T00:00:00Z', fee: 25.00 }]
  },
];

const referralEarningsData = [
  {
    referrerId: TEST_REVIEWER_1_UID,
    referredUserId: TEST_ARTIST_UID,
    commissionAmount: 500,
    status: 'pending',
    createdAt: new Date('2024-07-29T11:00:00Z').toISOString(),
    payoutId: null,
  },
];

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

async function seedFirestore() {
  console.log('Starting Firestore emulator seeding...');
  try {
    await seedCollection('users', usersData);
    await seedCollection('reviewers', reviewersData);
    await seedCollection('settings', Object.values(settingsData), null); // Settings has fixed doc IDs
    await seedCollection('applications', applicationsData);
    await seedCollection('referralCodes', referralCodesData, 'code'); // Use 'code' as doc ID for referral codes
    await seedCollection('submissions', submissionsData, null); // Auto-generate submission IDs
    await seedCollection('reviews', reviewsData, null); // Auto-generate review IDs
    await seedCollection('transactions', transactionsData, null); // Auto-generate transaction IDs
    await seedCollection('payouts', payoutsData, null); // Auto-generate payout IDs
    await seedCollection('referralEarnings', referralEarningsData, null); // Auto-generate referral earnings IDs

    console.log('Firestore emulator seeding complete!');
  } catch (error) {
    console.error('Error seeding Firestore emulator:', error);
  }
}

seedFirestore().catch(console.error);