# Amplifyd - Music Review Platform

A comprehensive music review platform built with Next.js, Firebase, and TypeScript. This platform connects artists with professional music reviewers for detailed feedback and analysis.

## 🚀 Features

### For Artists
- Submit music for professional review
- Choose from different review packages
- Track submission status
- Receive detailed feedback with scores
- Anonymous submission option

### For Reviewers
- Professional review dashboard
- Multiple review formats (written, audio, video)
- Earnings tracking and payouts
- Referral system for additional income
- Profile management

### For Administrators
- Complete admin dashboard
- User management
- Application approval system
- Financial tracking and payouts
- Referral system management
- Platform settings and security

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Firebase (Firestore, Auth, Functions, Storage)
- **Payments**: Stripe integration
- **Deployment**: Vercel (frontend), Firebase (backend)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- Firebase CLI
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/amplifyd.git
cd amplifyd
```

### 2. Install Dependencies

```bash
npm install
cd functions && npm install && cd ..
```

### 3. Environment Setup

Copy the example environment file and configure your Firebase project:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Development
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST=localhost:5001
NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
```

### 4. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication, Firestore, Functions, and Storage
3. Set up Firestore security rules (see `firestore.rules`)
4. Set up Storage rules (see `storage.rules`)
5. Deploy Firebase Functions:

```bash
firebase deploy --only functions
```

### 5. Start Development Servers

#### Option A: Production Mode
```bash
npm run dev
```

#### Option B: With Firebase Emulators (Recommended for Development)
```bash
# Terminal 1: Start Firebase emulators
firebase emulators:start

# Terminal 2: Start Next.js dev server
npm run dev
```

### 6. Access the Application

- **Main App**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Dev Tools**: http://localhost:3000/dev-setup
- **Firebase Emulator UI**: http://localhost:4000

## 📁 Project Structure

```
amplifyd/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── dashboard/         # User dashboard pages
│   │   └── ...
│   ├── components/            # React components
│   │   ├── admin/            # Admin-specific components
│   │   ├── ui/               # Reusable UI components
│   │   └── ...
│   ├── lib/                  # Utility libraries
│   │   ├── firebase/         # Firebase client services
│   │   ├── constants/        # Application constants
│   │   └── types/           # TypeScript type definitions
│   └── ...
├── functions/                # Firebase Cloud Functions
│   ├── src/
│   │   ├── callable/        # Callable functions
│   │   ├── webhooks/        # Webhook handlers
│   │   └── utils/           # Utility functions
│   └── ...
├── public/                  # Static assets
├── firestore.rules          # Firestore security rules
├── storage.rules            # Firebase Storage rules
└── firebase.json           # Firebase configuration
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript type checking

# Firebase
firebase emulators:start    # Start all emulators
firebase deploy            # Deploy to Firebase
firebase deploy --only functions  # Deploy only functions
```

### Development Workflow

1. **Start with Emulators**: Use Firebase emulators for local development
2. **Test Admin Features**: Access `/admin` for administrative functions
3. **Seed Data**: Use `/dev-setup` to populate test data
4. **Test User Flows**: Create accounts and test submission/review process

## 🧪 Testing

### Admin Dashboard Testing

1. Navigate to `/admin`
2. Test all sections:
   - Dashboard overview
   - User management
   - Application approval
   - Submission tracking
   - Financial management
   - Referral system
   - Platform settings

### User Flow Testing

1. Create a reviewer account
2. Submit a music review application
3. Approve the application (as admin)
4. Submit music for review
5. Complete a review
6. Test payment flow

## 🔒 Security

- Firestore security rules are configured for proper access control
- Authentication is required for sensitive operations
- Admin functions are protected with role-based access
- Environment variables are used for sensitive configuration

## 📦 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Firebase)

```bash
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation in `/docs`
- Review Firebase configuration
- Check the development guide in `DEVELOPMENT_TESTING_GUIDE.md`

## 🔄 Updates

To update the project on another device:

```bash
git pull origin main
npm install
cd functions && npm install && cd ..
```

Make sure to update your `.env.local` file with the latest environment variables.
